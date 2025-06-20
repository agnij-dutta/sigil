"use client"

import { Navigation } from "@/components/ui/navigation"
import { CommitsGrid } from "@/components/ui/commits-grid"
import { Feature } from "@/components/ui/feature-section-with-bento-grid"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Code, Check, Sparkles } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section id="hero" className="pt-24 pb-20 lg:pt-32 lg:pb-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="flex-1 space-y-8">
              <div className="space-y-4">
                <Badge variant="outline" className="w-fit">
                  Developer Credentials Platform
                </Badge>
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
                  Verify Your{" "}
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Code
                  </span>{" "}
                  Contributions
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
                  Create tamper-proof credentials of your development work. 
                  Prove your contributions from private repositories without exposing any code.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="bg-primary text-primary-foreground px-8 py-4 rounded-lg hover:bg-primary/90 transition-colors duration-200 flex items-center gap-2 font-medium">
                  Start Building Credentials
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button className="border border-border px-8 py-4 rounded-lg hover:bg-muted transition-colors duration-200 flex items-center gap-2 font-medium">
                  <Code className="w-4 h-4" />
                  View Demo
                </button>
              </div>
              
              <div className="flex items-center gap-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Privacy-first verification
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  GitHub integration
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Cryptographic proofs
                </div>
              </div>
            </div>
            
            <div className="flex-1 flex justify-center">
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">Your contributions, visualized</p>
                  <CommitsGrid text="SIGIL" />
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="w-4 h-4" />
                  Real GitHub contribution pattern
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features">
        <Feature />
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 lg:py-32 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <Badge variant="outline">Process</Badge>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              How Sigil Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Transform your development history into verifiable credentials in three simple steps.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg mx-auto">
                1
              </div>
              <h3 className="text-xl font-semibold">Connect Your Accounts</h3>
              <p className="text-muted-foreground">
                Link your GitHub account and wallet. Authorize access to repositories you want to verify.
              </p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg mx-auto">
                2
              </div>
              <h3 className="text-xl font-semibold">Generate Proofs</h3>
              <p className="text-muted-foreground">
                Our system analyzes your contributions and creates cryptographic proofs without accessing your code.
              </p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg mx-auto">
                3
              </div>
              <h3 className="text-xl font-semibold">Share Credentials</h3>
              <p className="text-muted-foreground">
                Get a verifiable portfolio link to share with recruiters, hiring managers, and teams.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="cta" className="py-20 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                Ready to Verify Your Work?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Join developers who are building trust in their contributions through verifiable credentials.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-primary text-primary-foreground px-8 py-4 rounded-lg hover:bg-primary/90 transition-colors duration-200 flex items-center gap-2 font-medium">
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </button>
              <button className="border border-border px-8 py-4 rounded-lg hover:bg-muted transition-colors duration-200 font-medium">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg">Sigil</h3>
              <span className="text-sm text-muted-foreground">© 2024</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Docs
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
