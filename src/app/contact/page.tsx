'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MapPin, Phone, Mail, Clock, Send, Home, LogIn } from 'lucide-react';
import Link from 'next/link';
import { useForm, ValidationError } from '@formspree/react';

export default function ContactPage() {
  // Replace with your actual Formspree form ID
  const FORMSPREE_FORM_ID = 'mnjgdeka'; // e.g. 'xrgvvkly'

  // Google Maps embed URL for the address


  // Note: Replace YOUR_API_KEY with a valid Google Maps API key.
  // If you don't have one, you can use a static map image or remove the key parameter for a limited embed.

  function ContactForm() {
    const [state, handleSubmit] = useForm(FORMSPREE_FORM_ID);

    if (state.succeeded) {
      return (
        <Card className="border-2 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Message Sent!</CardTitle>
            <CardDescription className="text-center">
              Thank you for reaching out. We'll get back to you within 24 hours.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center text-muted-foreground">
            <p>In the meantime, feel free to browse our resources or check your email for a confirmation.</p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button asChild variant="outline">
              <Link href="/">Return to Home</Link>
            </Button>
          </CardFooter>
        </Card>
      );
    }

    return (
      <Card className="border-2 shadow-xl h-fit">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <CardHeader>
            <CardTitle className="text-2xl">Send us a message</CardTitle>
            <CardDescription>
              We'd love to hear from you. Fill out the form and we'll respond as soon as possible.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input id="name" name="name" placeholder="Enter your full name" required />
              <ValidationError prefix="Name" field="name" errors={state.errors} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
              />
              <ValidationError prefix="Email" field="email" errors={state.errors} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" name="subject" placeholder="What's this about?" required />
              <ValidationError prefix="Subject" field="subject" errors={state.errors} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                name="message"
                placeholder="Your message..."
                rows={5}
                required
              />
              <ValidationError prefix="Message" field="message" errors={state.errors} />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col">
            <Button type="submit" size="lg" className="w-full" disabled={state.submitting}>
              {state.submitting ? (
                'Sending...'
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" /> Send Message
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Navigation Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary">
            ClearBook
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-1 text-sm font-medium text-slate-700 hover:text-primary dark:text-slate-300">
              <Home className="h-4 w-4" /> Home
            </Link>
            <Link href="/login" className="flex items-center gap-1 text-sm font-medium text-slate-700 hover:text-primary dark:text-slate-300">
              <LogIn className="h-4 w-4" /> Login
            </Link>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 md:py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 text-sm">
            📞 Get in touch
          </Badge>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            Contact Us
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Have questions about ClearBook? We're here to help. Reach out to us anytime.
          </p>
        </div>

        {/* Main grid: left column (info + map), right column (form) */}
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-start">
          {/* Left column */}
          <div className="space-y-8">
            {/* Contact info cards */}
            <Card className="border-2 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Our Office
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 dark:text-slate-300">
                  KM 142 Kano-Kaduna Expressway,<br />
                  SAJ Foods Factory,<br />
                  Zaria, Nigeria
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary" />
                  Direct Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Phone className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Phone</p>
                    <a
                      href="tel:+2348063386516"
                      className="text-slate-800 dark:text-slate-200 hover:underline"
                    >
                      +234 (0) 8063 386 516
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Email</p>
                    <a
                      href="mailto:contact@clearbook.africa"
                      className="text-slate-800 dark:text-slate-200 hover:underline block"
                    >
                      contact@clearbook.africa
                    </a>
                    <a
                      href="mailto:hello@clearbook.africa"
                      className="text-slate-800 dark:text-slate-200 hover:underline block"
                    >
                      hello@clearbook.africa
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      Business Hours
                    </p>
                    <p className="text-slate-800 dark:text-slate-200">
                      Monday – Friday: 8:00 AM – 5:00 PM (WAT)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

           {/* Map Card */}
<Card className="border-2 shadow-md overflow-hidden">
  <CardHeader className="pb-2">
    <CardTitle className="flex items-center gap-2 text-lg">
      <MapPin className="h-5 w-5 text-primary" />
      Find us on the map
    </CardTitle>
  </CardHeader>
  <CardContent className="p-0">
    <div className="h-64 w-full">
      <iframe
        src="https://www.google.com/maps/embed?pb=!1m10!1m8!1m3!1d3914.319101678173!2d7.749666688496462!3d11.163992402347343!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sng!4v1773312042169!5m2!1sen!2sng"
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="rounded-b-lg"
      ></iframe>
    </div>
  </CardContent>
  <CardFooter className="text-xs text-muted-foreground justify-center pt-2">
    KM 142 Kano-Kaduna Expressway, Zaria
  </CardFooter>
</Card>
          </div>

          {/* Right column – Contact Form */}
          <div className="w-full">
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}