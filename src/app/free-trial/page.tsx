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
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import Link from 'next/link';
import {
  Rocket,
  Shield,
  Users,
  Zap,
  CheckCircle,
  Star,
} from 'lucide-react';
import { useForm, ValidationError } from '@formspree/react'; // npm install @formspree/react

export default function FreeTrialPage() {
  // Replace with your actual Formspree form ID
  const FORMSPREE_FORM_ID = 'xpqvjpeo'; // Example ID – replace with yours

  // Separate component to use the useForm hook
  function FreeTrialForm() {
    const [state, handleSubmit] = useForm(FORMSPREE_FORM_ID);

    if (state.succeeded) {
      return (
        <Card className="border-2 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Thank you!</CardTitle>
            <CardDescription className="text-center">
              We've received your request and will reach out within 24 hours.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center text-muted-foreground">
            <p>In the meantime, feel free to explore our resources or check your email for a confirmation.</p>
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
      <Card className="border-2 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <CardHeader>
            <CardTitle className="text-2xl">Request Your Free Year</CardTitle>
            <CardDescription>
              Fill in your details – our team will contact you within 24 hours.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Company Name */}
            <div className="space-y-2">
              <Label htmlFor="company">Company Name</Label>
              <Input
                id="company"
                name="company"
                placeholder="Enter your company name"
                required
              />
              <ValidationError prefix="Company" field="company" errors={state.errors} />
            </div>

            {/* Your Name & Title */}
            <div className="space-y-2">
              <Label htmlFor="name_title">Your Name & Title</Label>
              <Input
                id="name_title"
                name="name_title"
                placeholder="e.g. Jane Doe, CEO"
                required
              />
              <ValidationError prefix="Name & Title" field="name_title" errors={state.errors} />
            </div>

            {/* Work Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Work Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@company.com"
                required
              />
              <ValidationError prefix="Email" field="email" errors={state.errors} />
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                required
              />
              <ValidationError prefix="Phone" field="phone" errors={state.errors} />
            </div>

            {/* Industry */}
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                name="industry"
                placeholder="e.g. Food Manufacturing, Textiles..."
                required
              />
              <ValidationError prefix="Industry" field="industry" errors={state.errors} />
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox id="terms" name="terms" required />
              <Label htmlFor="terms" className="text-sm font-normal">
                I agree to the{' '}
                <Link href="/terms" className="underline underline-offset-2 hover:text-primary">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="underline underline-offset-2 hover:text-primary">
                  Privacy Policy
                </Link>
                .
              </Label>
            </div>
            {/* ValidationError for terms (if needed, but checkbox presence is enough) */}
          </CardContent>

          <CardFooter className="flex flex-col">
            <Button type="submit" size="lg" className="w-full" disabled={state.submitting}>
              {state.submitting ? 'Submitting...' : 'Claim Your Free Year'}
            </Button>
            <p className="mt-4 text-xs text-muted-foreground">
              By submitting, you agree to our{' '}
              <Link href="/terms" className="underline underline-offset-2">
                Terms
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="underline underline-offset-2">
                Privacy Policy
              </Link>
              .
            </p>
          </CardFooter>
        </form>
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Hero / Main Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-start">
          {/* Left Column – Value Proposition */}
          <div className="space-y-8">
            <div>
              <Badge variant="outline" className="mb-4 text-sm">
                ✨ No credit card required
              </Badge>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                Claim Your Free Year
              </h1>
              <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-lg">
                Fill in your details and our team will reach out within 24 hours to set up your enterprise‑grade access.
              </p>
            </div>

            {/* Feature Bullets */}
            <div className="space-y-4">
              {[
                { icon: Rocket, text: 'Full platform access for one year' },
                { icon: Zap, text: 'All premium features unlocked' },
                { icon: Shield, text: 'Enterprise‑grade security' },
                { icon: Users, text: 'Priority onboarding support' },
              ].map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-1 rounded-full bg-primary/10 p-1">
                    <feature.icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-slate-700 dark:text-slate-300">
                    {feature.text}
                  </span>
                </div>
              ))}
            </div>

            {/* Social Proof – Real Testimonials */}
            <div className="space-y-4 pt-6">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
                <span className="ml-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  Rated 4.9/5 from 2,500+ reviews
                </span>
              </div>
              <div className="flex flex-wrap gap-4">
                {/* Testimonial 1 */}
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/avatars/sarah.jpg" />
                    <AvatarFallback>SC</AvatarFallback>
                  </Avatar>
                  <div className="text-sm">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      “Our team's productivity doubled.”
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      – Sarah Chen, Product Lead at Loom
                    </p>
                  </div>
                </div>
                {/* Testimonial 2 */}
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/avatars/marcus.jpg" />
                    <AvatarFallback>MR</AvatarFallback>
                  </Avatar>
                  <div className="text-sm">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      “The easiest onboarding ever.”
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      – Marcus Rodriguez, Founder
                    </p>
                  </div>
                </div>
                {/* Testimonial 3 */}
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/avatars/priya.jpg" />
                    <AvatarFallback>PK</AvatarFallback>
                  </Avatar>
                  <div className="text-sm">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      “Enterprise features without the complexity.”
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      – Priya Kapoor, CTO at FinScale
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-4 pt-4">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>GDPR compliant</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>99.9% uptime SLA</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>

          {/* Right Column – Sign‑up Card with Formspree React */}
          <div className="w-full max-w-md mx-auto lg:mx-0">
            <FreeTrialForm />
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="container mx-auto px-4 py-16 md:py-20 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-slate-50 mb-8">
            Frequently asked questions
          </h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>Do I need a credit card?</AccordionTrigger>
              <AccordionContent>
                No, absolutely not. Your free year is completely free – we don’t ask for payment details.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>What happens after the free year?</AccordionTrigger>
              <AccordionContent>
                You can choose a plan that fits your needs, or continue with a limited free version. You’ll never be charged automatically.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>Can I cancel anytime?</AccordionTrigger>
              <AccordionContent>
                Yes, you can cancel your participation at any time with one click – no questions asked.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger>How soon will your team reach out?</AccordionTrigger>
              <AccordionContent>
                Within 24 hours on business days. We’ll help you set up your account and answer any questions.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {/* Final CTA / Footer */}
      <div className="container mx-auto px-4 pb-12 text-center text-sm text-slate-500 dark:text-slate-400">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </div>
    </div>
  );
}
