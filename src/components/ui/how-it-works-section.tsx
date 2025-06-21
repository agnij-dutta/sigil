"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  UserPlus, 
  GitBranch, 
  Shield, 
  Award,
  ArrowRight,
  CheckCircle
} from "lucide-react"

const steps = [
  {
    step: "01",
    icon: UserPlus,
    title: "Connect Your Account",
    description: "Link your GitHub account and authenticate with Civic to establish your digital identity.",
    details: ["Secure OAuth integration", "Privacy-first approach", "One-time setup"]
  },
  {
    step: "02", 
    icon: GitBranch,
    title: "Sync Your Contributions",
    description: "Our system automatically analyzes your commits, pull requests, and repository contributions.",
    details: ["Real-time synchronization", "Comprehensive analysis", "Multiple repositories"]
  },
  {
    step: "03",
    icon: Shield,
    title: "Generate Credentials",
    description: "Your contributions are verified and transformed into cryptographically signed credentials.",
    details: ["Blockchain verification", "Tamper-proof records", "Industry standards"]
  },
  {
    step: "04",
    icon: Award,
    title: "Share & Showcase",
    description: "Use your verifiable credentials to prove your expertise to employers and collaborators.",
    details: ["Portable credentials", "Universal verification", "Professional showcase"]
  }
]

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 bg-background">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <Badge variant="outline" className="mb-4">
            <CheckCircle className="mr-2 h-4 w-4" />
            How It Works
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl mb-4">
            Simple Steps to{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Verification
            </span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Get started with Sigil in four easy steps and transform your GitHub contributions into verifiable credentials.
          </p>
        </div>
        
        <div className="relative">
          {/* Connection Lines */}
          <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-primary/20 via-primary/40 to-primary/20 lg:block" />
          
          <div className="space-y-12 lg:space-y-24">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isEven = index % 2 === 0
              
              return (
                <div key={index} className="relative">
                  {/* Step Number Circle */}
                  <div className="absolute left-1/2 top-8 hidden h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg lg:flex">
                    {step.step}
                  </div>
                  
                  <div className={`grid gap-8 lg:grid-cols-2 lg:gap-16 ${isEven ? '' : 'lg:grid-flow-col-dense'}`}>
                    {/* Content */}
                    <div className={`${isEven ? 'lg:text-right' : 'lg:col-start-2'}`}>
                      <Card className="group relative overflow-hidden border-2 transition-all duration-300 hover:border-primary/50 hover:shadow-lg">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                        <CardHeader className="relative">
                          <div className={`flex items-center gap-4 ${isEven ? 'lg:flex-row-reverse' : ''}`}>
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors lg:hidden">
                              <Icon className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1">
                              <Badge variant="secondary" className="mb-2 text-xs">
                                Step {step.step}
                              </Badge>
                              <CardTitle className="text-xl group-hover:text-primary transition-colors">
                                {step.title}
                              </CardTitle>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="relative">
                          <CardDescription className="text-base leading-relaxed mb-4">
                            {step.description}
                          </CardDescription>
                          <ul className="space-y-2">
                            {step.details.map((detail, detailIndex) => (
                              <li key={detailIndex} className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                                {detail}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                    
                    {/* Icon (Desktop only) */}
                    <div className={`hidden lg:flex items-center ${isEven ? 'justify-start' : 'justify-end lg:col-start-1'}`}>
                      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 border-4 border-background shadow-lg">
                        <Icon className="h-12 w-12 text-primary" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Arrow (not on last item) */}
                  {index < steps.length - 1 && (
                    <div className="flex justify-center mt-8 lg:hidden">
                      <ArrowRight className="h-6 w-6 text-primary" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

export { HowItWorksSection } 