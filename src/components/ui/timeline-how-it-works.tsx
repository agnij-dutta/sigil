"use client";

import React from "react";
import { Timeline, TimelineEntry } from "./timeline";
import { Card, CardContent } from "./card";
import { Badge } from "./badge";
import { CheckCircle, UserPlus, GitBranch, Shield, Award } from "lucide-react";

const timelineData: TimelineEntry[] = [
  {
    title: "Step 01",
    content: (
      <Card className="group relative overflow-hidden border-2 transition-all duration-300 hover:border-primary/50 hover:shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <UserPlus className="h-6 w-6 text-primary" />
            </div>
            <div>
              <Badge variant="secondary" className="mb-2">
                Connect Your Account
              </Badge>
              <p className="text-lg font-semibold group-hover:text-primary transition-colors">
                Link your GitHub account and authenticate with Civic
              </p>
            </div>
          </div>
          <p className="text-muted-foreground mb-4">
            Establish your digital identity securely using our privacy-first approach. 
            This one-time setup creates a foundation for all your verifiable credentials.
          </p>
          <ul className="space-y-2">
            <li className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
              Secure OAuth integration
            </li>
            <li className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
              Privacy-first approach
            </li>
            <li className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
              One-time setup
            </li>
          </ul>
        </CardContent>
      </Card>
    ),
  },
  {
    title: "Step 02",
    content: (
      <Card className="group relative overflow-hidden border-2 transition-all duration-300 hover:border-primary/50 hover:shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <GitBranch className="h-6 w-6 text-primary" />
            </div>
            <div>
              <Badge variant="secondary" className="mb-2">
                Sync Your Contributions
              </Badge>
              <p className="text-lg font-semibold group-hover:text-primary transition-colors">
                Analyze your repositories and commits
              </p>
            </div>
          </div>
          <p className="text-muted-foreground mb-4">
            Our system automatically analyzes your commits, pull requests, and repository 
            contributions while maintaining complete privacy of your code.
          </p>
          <ul className="space-y-2">
            <li className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
              Real-time synchronization
            </li>
            <li className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
              Comprehensive analysis
            </li>
            <li className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
              Multiple repositories
            </li>
          </ul>
        </CardContent>
      </Card>
    ),
  },
  {
    title: "Step 03",
    content: (
      <Card className="group relative overflow-hidden border-2 transition-all duration-300 hover:border-primary/50 hover:shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <Badge variant="secondary" className="mb-2">
                Generate Credentials
              </Badge>
              <p className="text-lg font-semibold group-hover:text-primary transition-colors">
                Create cryptographically signed proofs
              </p>
            </div>
          </div>
          <p className="text-muted-foreground mb-4">
            Your contributions are verified and transformed into zero-knowledge proofs that 
            protect your privacy while providing cryptographic verification.
          </p>
          <ul className="space-y-2">
            <li className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
              Blockchain verification
            </li>
            <li className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
              Tamper-proof records
            </li>
            <li className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
              Industry standards
            </li>
          </ul>
        </CardContent>
      </Card>
    ),
  },
  {
    title: "Step 04",
    content: (
      <Card className="group relative overflow-hidden border-2 transition-all duration-300 hover:border-primary/50 hover:shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Award className="h-6 w-6 text-primary" />
            </div>
            <div>
              <Badge variant="secondary" className="mb-2">
                Share & Showcase
              </Badge>
              <p className="text-lg font-semibold group-hover:text-primary transition-colors">
                Prove your expertise with verifiable credentials
              </p>
            </div>
          </div>
          <p className="text-muted-foreground mb-4">
            Use your verifiable credentials to prove your expertise to employers and collaborators
            without revealing sensitive code or project details.
          </p>
          <ul className="space-y-2">
            <li className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
              Portable credentials
            </li>
            <li className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
              Universal verification
            </li>
            <li className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
              Professional showcase
            </li>
          </ul>
        </CardContent>
      </Card>
    ),
  },
];

export function TimelineHowItWorks() {
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
        
        <Timeline data={timelineData} />
      </div>
    </section>
  );
} 