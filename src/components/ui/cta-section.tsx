"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Sparkles, Rocket } from "lucide-react"

function CTASection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-background py-24">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-grid-small-black/[0.2] bg-[size:20px_20px] dark:bg-grid-small-white/[0.2]" />
      <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute right-1/4 bottom-0 h-96 w-96 rounded-full bg-secondary/30 blur-3xl" />
      
      <div className="relative container mx-auto px-4 md:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium">
            <Rocket className="mr-2 h-4 w-4" />
            Ready to Get Started?
          </Badge>
          
          {/* Main Heading */}
          <h2 className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            Transform Your{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              GitHub Profile
            </span>{" "}
            Today
          </h2>
          
          {/* Subtitle */}
          <p className="mb-8 text-xl text-muted-foreground md:text-2xl">
            Join thousands of developers who are already building trust and showcasing their expertise with verifiable credentials.
          </p>
          
          {/* CTA Buttons */}
          <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="group px-8 py-6 text-lg">
              <Link href="/dashboard">
                Start Building Credentials
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="px-8 py-6 text-lg">
              View Demo
            </Button>
          </div>
          
          {/* Trust Indicators */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center">
              <div className="mb-2 text-3xl font-bold text-primary">5 min</div>
              <div className="text-sm text-muted-foreground">Setup Time</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="mb-2 text-3xl font-bold text-primary">Free</div>
              <div className="text-sm text-muted-foreground">To Get Started</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="mb-2 text-3xl font-bold text-primary">24/7</div>
              <div className="text-sm text-muted-foreground">Verification</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export { CTASection } 