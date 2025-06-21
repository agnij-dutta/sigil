"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Icons } from "@/components/ui/icons"
import { ArrowRight, Shield, Zap, Users } from "lucide-react"

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background to-muted/20">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-grid-small-black/[0.2] bg-[size:20px_20px] dark:bg-grid-small-white/[0.2]" />
      <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute right-0 top-20 h-96 w-96 rounded-full bg-secondary/20 blur-3xl" />
      
      <div className="relative container mx-auto px-4 py-24 md:px-6 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium">
            <Zap className="mr-2 h-4 w-4" />
            Verifiable Developer Credentials
          </Badge>
          
          {/* Main Heading */}
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-6xl lg:text-7xl">
            Prove Your{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Code
            </span>{" "}
            <br />
            Own Your{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Reputation
            </span>
          </h1>
          
          {/* Subtitle */}
          <p className="mb-8 text-xl text-muted-foreground md:text-2xl">
            Transform your GitHub contributions into verifiable credentials. 
            Build trust, showcase expertise, and unlock new opportunities in the developer ecosystem.
          </p>
          
          {/* CTA Buttons */}
          <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="group px-8 py-6 text-lg">
              <Link href="/dashboard">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="px-8 py-6 text-lg">
              Learn More
            </Button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div className="text-2xl font-bold">100%</div>
              <div className="text-sm text-muted-foreground">Verifiable</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div className="text-2xl font-bold">1000+</div>
              <div className="text-sm text-muted-foreground">Developers</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Icons.github className="h-6 w-6 text-primary" />
              </div>
              <div className="text-2xl font-bold">50K+</div>
              <div className="text-sm text-muted-foreground">Commits Verified</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export { HeroSection } 