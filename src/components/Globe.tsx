'use client'
import React, { useEffect, useRef } from "react"

const africanCountries = [
  "Nigeria","Ethiopia","Egypt","DR Congo","Tanzania","South Africa",
  "Kenya","Uganda","Algeria","Sudan","Morocco","Angola","Mozambique",
  "Ghana","Madagascar","Cameroon","Côte d'Ivoire","Niger","Burkina Faso",
  "Mali","Malawi","Zambia","Senegal","Chad","Somalia","Zimbabwe",
  "Guinea","Rwanda","Benin","Burundi","Tunisia","Togo","Sierra Leone",
  "Libya","Congo","Liberia","Central African Republic","Mauritania",
  "Eritrea","Namibia","Gambia","Botswana","Gabon","Lesotho",
  "Guinea-Bissau","Equatorial Guinea","Mauritius","Eswatini","Djibouti",
  "Comoros","Cabo Verde","Sao Tome & Principe","Seychelles"
]

const majorMarkets = ["Nigeria","Kenya","South Africa","Ghana","Egypt"]

// ─── Rough continental land mask ───────────────────────────────────────────
function isLand(lat: number, lng: number): boolean {
  // Africa
  if (lat >= -35 && lat <= 37 && lng >= -18 && lng <= 52) {
    if (lat > 30 && lng < -2) return false
    if (lat < -25 && lng > 44) return false
    return true
  }
  // Europe
  if (lat >= 35 && lat <= 71 && lng >= -10 && lng <= 40) return true
  // Asia
  if (lat >= 5 && lat <= 75 && lng >= 40 && lng <= 145) return true
  // SE Asia islands
  if (lat >= -10 && lat <= 20 && lng >= 95 && lng <= 140) return true
  // North America
  if (lat >= 15 && lat <= 75 && lng >= -170 && lng <= -50) return true
  // South America
  if (lat >= -56 && lat <= 13 && lng >= -82 && lng <= -34) return true
  // Australia
  if (lat >= -44 && lat <= -10 && lng >= 113 && lng <= 154) return true
  // Greenland
  if (lat >= 60 && lat <= 84 && lng >= -55 && lng <= -18) return true
  return false
}

// ─── Inner dot-matrix globe canvas ─────────────────────────────────────────
function GlobeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef    = useRef<number>(0)
  const rotRef    = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const SIZE = 560          // canvas logical px — wider globe
    const dpr  = window.devicePixelRatio || 1
    canvas.width  = SIZE * dpr
    canvas.height = SIZE * dpr
    ctx.scale(dpr, dpr)

    const cx = SIZE / 2
    const cy = SIZE / 2
    const R  = SIZE / 2 - 4  // globe radius

    function draw() {
      ctx.clearRect(0, 0, SIZE, SIZE)

      // ── sphere gradient ──
      const sg = ctx.createRadialGradient(cx - R * 0.25, cy - R * 0.3, 0, cx, cy, R)
      sg.addColorStop(0,   'rgba(235, 248, 238, 1)')   // was 220,245,225
      sg.addColorStop(0.6, 'rgba(210, 238, 215, 1)')   // was 185,230,195
      sg.addColorStop(1,   'rgba(185, 220, 192, 1)')   // was 140,200,160
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.fillStyle = sg
      ctx.fill()

      // ── clip to sphere ──
      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.clip()

      // ── latitude lines ──
      for (let lat = -60; lat <= 60; lat += 30) {
        const latRad = (lat * Math.PI) / 180
        const ey  = cy - R * Math.sin(latRad)
        const erx = R
        const ery = R * Math.abs(Math.cos(latRad)) * 0.18
        ctx.beginPath()
        ctx.ellipse(cx, ey, erx, ery, 0, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(60, 140, 80, 0.18)'
        ctx.lineWidth = 0.6
        ctx.stroke()
      }

      // ── longitude lines ──
      for (let lng = 0; lng < 180; lng += 30) {
        const lngRad = ((lng + rotRef.current) * Math.PI) / 180
        const x1 = cx + R * Math.sin(lngRad)
        const x2 = cx - R * Math.sin(lngRad)
        ctx.beginPath()
        ctx.moveTo(x1, cy + R)
        ctx.quadraticCurveTo(cx, cy - R, x2, cy + R)
        ctx.strokeStyle = 'rgba(60, 140, 80, 0.12)'
        ctx.lineWidth = 0.6
        ctx.stroke()
      }

      // ── dot-matrix continents ──
      const step = 5
      for (let lat = -85; lat <= 85; lat += step) {
        for (let lng = -180; lng <= 180; lng += step) {
          if (!isLand(lat, lng)) continue

          const lngRot = lng + rotRef.current
          const lngRad = (lngRot * Math.PI) / 180
          const latRad = (lat    * Math.PI) / 180

          const x3 = Math.cos(latRad) * Math.sin(lngRad)
          const y3 = Math.sin(latRad)
          const z3 = Math.cos(latRad) * Math.cos(lngRad)

          if (z3 < 0) continue   // back-face cull

          const px = cx + R * x3
          const py = cy - R * y3

          const depth = (z3 + 1) / 2
          const dotR  = 0.7 + depth * 1.1
          const alpha = 0.25 + depth * 0.6

          ctx.beginPath()
          ctx.arc(px, py, dotR, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(30, 120, 60, ${alpha})`
          ctx.fill()
        }
      }

      ctx.restore()

      // ── rim glow ──
      const rg = ctx.createRadialGradient(cx, cy, R - 3, cx, cy, R + 8)
      rg.addColorStop(0,   'rgba(50, 180, 80, 0)')
      rg.addColorStop(0.5, 'rgba(50, 180, 80, 0.2)')
      rg.addColorStop(1,   'rgba(50, 180, 80, 0)')
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.strokeStyle = rg
      ctx.lineWidth = 8
      ctx.stroke()

      rotRef.current += 0.07
      rafRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ width: 360, height: 360, borderRadius: '50%' }}
    />
  )
}

// ─── Main Globe component ───────────────────────────────────────────────────
const radius = 420

export default function Globe() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">

      {/* Orbit Rings — unchanged */}
      <div className="absolute w-[900px] h-[900px] rounded-full border border-gray-200 opacity-40 animate-spin-slow"/>
      <div className="absolute w-[650px] h-[650px] rounded-full border border-blue-200 opacity-60 animate-spin-medium"/>
      <div className="absolute w-[420px] h-[420px] rounded-full border border-indigo-200 opacity-80 animate-spin-fast"/>

      {/* Inner globe — replaces the star SVG */}
      <div className="absolute flex items-center justify-center">
        <GlobeCanvas />
      </div>

      {/* Orbiting Countries — unchanged */}
      <div className="absolute w-full h-full animate-spin-countries">
        {africanCountries.map((country, index) => {
          const angle = (index / africanCountries.length) * 360 - 90
          return (
            <div
              key={country}
              className="absolute top-1/2 left-1/2"
              style={{ transform: `rotate(${angle}deg) translate(${radius}px)` }}
            >
              <span
    className={`block -rotate-[${angle}deg] whitespace-nowrap text-xs uppercase tracking-widest ${
      majorMarkets.includes(country)
        ? "text-blue-600 font-semibold"
        : "text-gray-400"
    }`}
  >
    {country}
  </span>
            </div>
          )
        })}
      </div>

    </div>
  )
}