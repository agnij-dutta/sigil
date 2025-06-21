"use client";

import { useState } from "react";
import { ProofExplainer } from "@/components/ui/proof-explainer";
import Header from "@/components/ui/header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Code, FileCode, GitBranch, Users, Lightbulb, Lock } from "lucide-react";

export default function ExplainPage() {
  const [selectedProofType, setSelectedProofType] = useState<string>("commit");
  
  const proofTypes = [
    { id: "commit", name: "Commit Proofs", icon: <Code className="w-4 h-4" /> },
    { id: "repository", name: "Repository Proofs", icon: <GitBranch className="w-4 h-4" /> },
    { id: "language", name: "Language Proofs", icon: <FileCode className="w-4 h-4" /> },
    { id: "collaboration", name: "Collaboration Proofs", icon: <Users className="w-4 h-4" /> },
    { id: "privacy", name: "Privacy Proofs", icon: <Lock className="w-4 h-4" /> },
  ];
  
  // Sample contexts for each proof type
  const proofContexts: Record<string, string> = {
    commit: "The proof verifies the number of commits made by a developer without revealing specific commit details.",
    repository: "The proof demonstrates contributions to specific repositories without revealing private repository information.",
    language: "The proof shows programming language proficiency based on actual code contributions.",
    collaboration: "The proof verifies collaboration with other developers on projects without revealing their identities.",
    privacy: "The proof ensures personal information is protected while sharing contribution statistics.",
  };
  
  // Sample public signals for each proof type
  const proofPublicSignals: Record<string, string[]> = {
    commit: ["minimumCommits: 50", "maximumCommits: 100", "timeframeStart: January 2023", "timeframeEnd: December 2023"],
    repository: ["repositoryCount: 5", "minStars: 10", "hasPublicRepos: true"],
    language: ["languageCount: 4", "primaryLanguageProficiency: Expert"],
    collaboration: ["collaboratorCount: 12", "teamSize: Medium", "contributionPercentage: 30%"],
    privacy: ["k-anonymity: 5", "dataAccuracyLevel: Medium", "privacyBudget: 0.1"],
  };

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-white mb-4">Understanding Zero-Knowledge Proofs</h1>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Zero-knowledge proofs allow you to prove facts about your GitHub contributions without revealing sensitive details. Select a proof type below to learn more.
            </p>
          </div>
          
          <Tabs
            defaultValue="commit"
            value={selectedProofType}
            onValueChange={setSelectedProofType}
            className="mb-8"
          >
            <TabsList className="grid grid-cols-5 mb-8">
              {proofTypes.map((type) => (
                <TabsTrigger key={type.id} value={type.id} className="flex items-center gap-2">
                  {type.icon}
                  <span className="hidden sm:inline">{type.name.split(' ')[0]}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            
            {proofTypes.map((type) => (
              <TabsContent key={type.id} value={type.id}>
                <ProofExplainer 
                  proofType={type.id}
                  context={proofContexts[type.id]}
                  publicSignals={proofPublicSignals[type.id]}
                />
                
                <Card className="p-6 mt-8 bg-gray-950 border-gray-800">
                  <div className="flex items-start gap-4">
                    <div className="bg-yellow-900/20 p-3 rounded-full">
                      <Lightbulb className="w-6 h-6 text-yellow-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-white mb-2">Pro Tip: Using {type.name}</h3>
                      <p className="text-gray-400">
                        {type.id === "commit" && "Commit proofs are perfect for demonstrating consistent contribution history to potential employers without exposing proprietary code or private repositories."}
                        {type.id === "repository" && "Repository proofs allow you to prove your contribution to high-profile projects while maintaining the privacy of internal codebases and specific implementation details."}
                        {type.id === "language" && "Language proofs can help showcase your technical diversity and expertise in specific programming languages with cryptographic verification."}
                        {type.id === "collaboration" && "Collaboration proofs demonstrate your teamwork abilities by proving you've successfully worked with numerous developers without revealing who they are or specific project details."}
                        {type.id === "privacy" && "Privacy proofs give you complete control over what information you share, allowing selective disclosure while maintaining cryptographic verification of your claims."}
                      </p>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
          
          <div className="flex justify-center mt-12">
            <Button asChild className="bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600">
              <a href="/proof/generate">
                Generate Your Own Proofs
              </a>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
} 