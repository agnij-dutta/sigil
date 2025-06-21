"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Shield, 
  Zap, 
  Users, 
  GitBranch, 
  Award, 
  Lock,
  Globe,
  Sparkles
} from "lucide-react"

const features = [
  {
    icon: Shield,
    title: "Verifiable Credentials",
    description: "Cryptographically signed credentials that prove your contributions are authentic and tamper-proof.",
    badge: "Security"
  },
  {
    icon: GitBranch,
    title: "GitHub Integration",
    description: "Seamlessly connect your GitHub account to automatically verify commits, PRs, and contributions.",
    badge: "Integration"
  },
  {
    icon: Award,
    title: "Skill Recognition",
    description: "Get recognized for your expertise in specific technologies, languages, and frameworks.",
    badge: "Recognition"
  },
  {
    icon: Zap,
    title: "Instant Verification",
    description: "Real-time verification of your contributions with blockchain-backed proof of authenticity.",
    badge: "Speed"
  },
  {
    icon: Users,
    title: "Community Trust",
    description: "Build trust within the developer community with transparent, verifiable achievement records.",
    badge: "Community"
  },
  {
    icon: Globe,
    title: "Universal Standards",
    description: "Based on W3C standards for verifiable credentials, ensuring interoperability across platforms.",
    badge: "Standards"
  }
]

function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <Badge variant="outline" className="mb-4">
            <Sparkles className="mr-2 h-4 w-4" />
            Features
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl mb-4">
            Why Choose{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Sigil
            </span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Discover the powerful features that make Sigil the go-to platform for verifiable developer credentials.
          </p>
        </div>
        
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card 
                key={index} 
                className="group relative overflow-hidden border-2 transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:-translate-y-1"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <CardHeader className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {feature.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export { FeaturesSection } 