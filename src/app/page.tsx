import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, TrendingUp, CheckCircle } from "lucide-react";
import Globe from "@/components/Globe";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-white via-gray-50 to-white text-gray-900">

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex h-16 items-center justify-between">

            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/favicon.ico"
                alt="ClearBook"
                width={38}
                height={38}
                className="rounded-lg shadow-sm"
                priority
              />
              <span className="text-xl font-semibold tracking-tight">
                ClearBook
              </span>
            </Link>

            <nav className="hidden items-center gap-8 md:flex">
              <Link href="#features" className="text-sm text-gray-600 hover:text-gray-900">
                Features
              </Link>
              <Link href="#pricing" className="text-sm text-gray-600 hover:text-gray-900">
                Pricing
              </Link>
              <Link href="/contact" className="text-sm text-gray-600 hover:text-gray-900">
                Contact
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" size="sm">Login</Button>
              </Link>

              <Link href="/free-trial">
                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                  Start Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative isolate overflow-hidden pt-24 pb-32 md:pt-32">

        <Globe />

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">

          {/* badge */}
          <div className="mb-6 flex justify-center">
            <span className="rounded-full border border-green-200 bg-green-50 px-4 py-1 text-sm text-green-700">
              Built for African Businesses
            </span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            Finally — Accounting Software
            <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-green-600 to-emerald-400 bg-clip-text text-transparent">
              Built for Africa
            </span>
          </h1>

          <p className="mt-6 text-lg text-gray-600 sm:text-xl">
            ClearBook unifies accounting, procurement, inventory and manufacturing
            into one modern ERP platform designed for African businesses.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href="/free-trial">
              <Button
                size="lg"
                className="min-w-[180px] bg-green-600 text-base shadow-lg hover:bg-green-700 hover:shadow-xl"
              >
                Start Free Trial
              </Button>
            </Link>

            <Link href="#features">
              <Button
                size="lg"
                variant="outline"
                className="min-w-[180px] text-base hover:bg-gray-100"
              >
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="border-y bg-gray-50 py-10">
        <div className="mx-auto max-w-6xl px-6 text-center">

          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
            Trusted across Africa
          </p>

          <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-4">

            <TrustCountry name="Nigeria" />
            <TrustCountry name="Kenya" />
            <TrustCountry name="Ghana" />
            <TrustCountry name="South Africa" />

          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24 md:py-32 bg-gradient-to-b from-gray-50 to-white">

        <div className="mx-auto max-w-7xl px-6">

          <div className="mb-16 text-center">

            <h2 className="text-4xl font-bold md:text-5xl">
              Everything your business needs
              <br className="hidden sm:block" />
              in one platform
            </h2>

            <p className="mt-4 text-lg text-gray-600">
              Manage your financial operations with modern tools built for clarity and speed.
            </p>

          </div>

          <div className="grid gap-8 md:grid-cols-3">

            <FeatureCard
              icon={<FileText className="h-7 w-7 text-blue-600" />}
              bgColor="bg-blue-50"
              title="Effortless Invoicing"
              description="Create professional invoices in seconds and track payments automatically."
            />

            <FeatureCard
              icon={<TrendingUp className="h-7 w-7 text-green-600" />}
              bgColor="bg-green-50"
              title="Expense Tracking"
              description="Record and categorize expenses easily with real-time financial insights."
            />

            <FeatureCard
              icon={<CheckCircle className="h-7 w-7 text-purple-600" />}
              bgColor="bg-purple-50"
              title="Financial Reporting"
              description="Generate Profit & Loss, Balance Sheets and cash-flow reports instantly."
            />

          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t bg-white py-12">
        <div className="mx-auto max-w-7xl px-6 grid gap-8 md:grid-cols-3 text-sm text-gray-600">

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">ClearBook</h3>
            <p>Modern ERP platform built for African businesses.</p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Product</h3>
            <ul className="space-y-1">
              <li><Link href="#features">Features</Link></li>
              <li><Link href="#pricing">Pricing</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Company</h3>
            <ul className="space-y-1">
              <li><Link href="/contact">Contact</Link></li>
            </ul>
          </div>

        </div>

        <div className="text-center text-xs text-gray-400 mt-8">
          © {new Date().getFullYear()} ClearBook Africa
        </div>
      </footer>
    </div>
  );
}

function TrustCountry({ name }: { name: string }) {
  return (
    <div className="rounded-lg border bg-white py-3 shadow-sm">
      {name}
    </div>
  );
}

function FeatureCard({
  icon,
  bgColor,
  title,
  description,
}: {
  icon: React.ReactNode;
  bgColor: string;
  title: string;
  description: string;
}) {
  return (
    <Card className="group border shadow-sm transition-all duration-300 hover:-translate-y-3 hover:shadow-2xl">
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <div className={`rounded-lg p-3 ${bgColor}`}>{icon}</div>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}