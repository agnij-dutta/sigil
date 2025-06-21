'use client';

import { Header } from "@/components/ui/header"
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { 
  ArrowLeft,
  Github, 
  Shield, 
  Zap,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  Code,
  GitBranch,
  Star,
  Eye,
  FileCheck,
  Loader2,
  Download,
  Copy,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { useWallet } from '../../../../web3/wallet/hooks/useWallet';

interface Repository {
  id: string;
  name: string;
  full_name: string;
  html_url: string;
  description: string;
  language: string;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  private: boolean;
}

interface ProofData {
  repositoryData: any;
  contributions: any;
  skillAnalysis: any;
  privacyLevel: 'minimal' | 'balanced' | 'maximum';
}

export default function ProofGeneration() {
  const { isAuthenticated, hasWallet } = useWallet();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [generatingProof, setGeneratingProof] = useState(false);
  const [proofData, setProofData] = useState<ProofData | null>(null);
  const [step, setStep] = useState(1);
  const [privacyLevel, setPrivacyLevel] = useState<'minimal' | 'balanced' | 'maximum'>('balanced');
  const [generatedProof, setGeneratedProof] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && hasWallet) {
      fetchRepositories();
    }
  }, [isAuthenticated, hasWallet]);

  const fetchRepositories = async () => {
    try {
      setLoadingRepos(true);
      const response = await fetch('/api/github/repositories');
      if (response.ok) {
        const data = await response.json();
        setRepositories(data.repositories || []);
      }
    } catch (error) {
      console.error('Failed to fetch repositories:', error);
    } finally {
      setLoadingRepos(false);
    }
  };

  const generateProof = async () => {
    if (!selectedRepo) return;
    
    try {
      setGeneratingProof(true);
      setStep(3);

      // Simulate proof generation steps
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock generated proof
      const mockProof = {
        proof: "zk_proof_" + Date.now(),
        publicSignals: ["signal1", "signal2"],
        metadata: {
          repository: selectedRepo.full_name,
          timestamp: new Date().toISOString(),
          privacyLevel
        }
      };

      setGeneratedProof(JSON.stringify(mockProof, null, 2));
      setStep(4);
    } catch (error) {
      console.error('Failed to generate proof:', error);
    } finally {
      setGeneratingProof(false);
    }
  };

  const copyProof = () => {
    if (generatedProof) {
      navigator.clipboard.writeText(generatedProof);
    }
  };

  if (!isAuthenticated || !hasWallet) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="container mx-auto px-6 py-12">
          <div className="glass-card p-8 rounded-2xl text-center max-w-md mx-auto">
            <Shield className="w-16 h-16 text-purple-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">Authentication Required</h2>
            <p className="text-gray-400 mb-6">
              Please connect your wallet and GitHub account to generate proofs.
            </p>
            <Button asChild className="bg-gradient-to-r from-purple-500 to-blue-500">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" asChild className="text-gray-400 hover:text-white">
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">Generate Zero-Knowledge Proof</h1>
            <p className="text-gray-400 text-lg">
              Create verifiable credentials from your GitHub contributions while preserving privacy
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-12">
            <div className="flex items-center space-x-4">
              {[
                { num: 1, label: 'Select Repository', icon: Github },
                { num: 2, label: 'Configure Privacy', icon: Shield },
                { num: 3, label: 'Generate Proof', icon: Zap },
                { num: 4, label: 'Download Result', icon: Download }
              ].map(({ num, label, icon: Icon }, index) => (
                <div key={num} className="flex items-center">
                  <div className={`flex items-center gap-2 ${step >= num ? 'text-purple-400' : 'text-gray-500'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                      step >= num 
                        ? 'border-purple-400 bg-purple-400/20' 
                        : 'border-gray-500 bg-gray-500/10'
                    }`}>
                      {step > num ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                    </div>
                    <span className="text-sm font-medium hidden sm:block">{label}</span>
                  </div>
                  {index < 3 && (
                    <div className={`w-8 h-px mx-4 ${step > num ? 'bg-purple-400' : 'bg-gray-600'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step 1: Repository Selection */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="glass-card p-6 rounded-2xl">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Github className="w-5 h-5" />
                  Select Repository
                </h2>
                <p className="text-gray-400 mb-6">
                  Choose a repository to generate verifiable proof of your contributions
                </p>

                {loadingRepos ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-4 text-purple-400" />
                    <p className="text-gray-400">Loading repositories...</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {repositories.map((repo) => (
                      <div
                        key={repo.id}
                        className={`glass-card p-4 rounded-xl cursor-pointer transition-all hover:bg-white/10 ${
                          selectedRepo?.id === repo.id ? 'border-purple-400 bg-purple-500/10' : 'border-white/10'
                        }`}
                        onClick={() => setSelectedRepo(repo)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-white">{repo.name}</h3>
                              {repo.private && (
                                <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 text-xs">
                                  Private
                                </Badge>
                              )}
                            </div>
                            <p className="text-gray-400 text-sm mb-3">
                              {repo.description || 'No description available'}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Code className="w-3 h-3" />
                                {repo.language || 'Unknown'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Star className="w-3 h-3" />
                                {repo.stargazers_count}
                              </span>
                              <span className="flex items-center gap-1">
                                <GitBranch className="w-3 h-3" />
                                {repo.forks_count}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(repo.updated_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="text-gray-400 hover:text-white"
                          >
                            <Link href={repo.html_url} target="_blank">
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedRepo && (
                  <div className="mt-6 flex justify-end">
                    <Button
                      onClick={() => setStep(2)}
                      className="bg-gradient-to-r from-purple-500 to-blue-500"
                    >
                      Next: Configure Privacy
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Privacy Configuration */}
          {step === 2 && selectedRepo && (
            <div className="space-y-6">
              <div className="glass-card p-6 rounded-2xl">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Configure Privacy Level
                </h2>
                <p className="text-gray-400 mb-6">
                  Choose how much information to reveal in your proof for repository: <span className="text-white font-mono">{selectedRepo.full_name}</span>
                </p>

                <div className="grid gap-4">
                  {[
                    {
                      level: 'minimal' as const,
                      title: 'Minimal Privacy',
                      description: 'Reveals repository name, commit count, and languages used',
                      features: ['Repository identification', 'Commit statistics', 'Language breakdown', 'Contribution timeline']
                    },
                    {
                      level: 'balanced' as const,
                      title: 'Balanced Privacy',
                      description: 'Reveals general contribution patterns without specific details',
                      features: ['Activity patterns', 'Skill proficiency', 'Collaboration metrics', 'Code quality indicators']
                    },
                    {
                      level: 'maximum' as const,
                      title: 'Maximum Privacy',
                      description: 'Only proves contribution existence without revealing specifics',
                      features: ['Contribution existence', 'General timeframe', 'Skill categories', 'Peer validation']
                    }
                  ].map(({ level, title, description, features }) => (
                    <div
                      key={level}
                      className={`glass-card p-4 rounded-xl cursor-pointer transition-all hover:bg-white/10 ${
                        privacyLevel === level ? 'border-purple-400 bg-purple-500/10' : 'border-white/10'
                      }`}
                      onClick={() => setPrivacyLevel(level)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 mt-1 ${
                          privacyLevel === level ? 'border-purple-400 bg-purple-400' : 'border-gray-500'
                        }`} />
                        <div className="flex-1">
                          <h3 className="font-semibold text-white mb-1">{title}</h3>
                          <p className="text-gray-400 text-sm mb-3">{description}</p>
                          <div className="flex flex-wrap gap-2">
                            {features.map((feature) => (
                              <Badge
                                key={feature}
                                variant="secondary"
                                className="bg-gray-500/20 text-gray-300 text-xs"
                              >
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={generateProof}
                    className="bg-gradient-to-r from-purple-500 to-blue-500"
                  >
                    Generate Proof
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Generating Proof */}
          {step === 3 && generatingProof && (
            <div className="space-y-6">
              <div className="glass-card p-8 rounded-2xl text-center">
                <Loader2 className="w-16 h-16 animate-spin mx-auto mb-6 text-purple-400" />
                <h2 className="text-2xl font-bold text-white mb-4">Generating Zero-Knowledge Proof</h2>
                <p className="text-gray-400 mb-6">
                  Processing your contributions and generating cryptographic proof...
                </p>
                <div className="space-y-2 text-sm text-gray-400">
                  <p>• Analyzing repository data...</p>
                  <p>• Computing contribution metrics...</p>
                  <p>• Generating zero-knowledge circuit...</p>
                  <p>• Creating verifiable proof...</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Proof Generated */}
          {step === 4 && generatedProof && (
            <div className="space-y-6">
              <div className="glass-card p-6 rounded-2xl">
                <div className="text-center mb-6">
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-white mb-2">Proof Generated Successfully!</h2>
                  <p className="text-gray-400">
                    Your zero-knowledge proof is ready to be shared and verified
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">
                      Generated Proof (JSON)
                    </label>
                    <div className="relative">
                      <Textarea
                        value={generatedProof}
                        readOnly
                        className="bg-black/50 border-white/10 text-white font-mono text-xs h-48 resize-none"
                      />
                      <Button
                        onClick={copyProof}
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 text-gray-400 hover:text-white"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      className="bg-gradient-to-r from-purple-500 to-blue-500 flex-1"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Proof
                    </Button>
                    <Button
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10 flex-1"
                      asChild
                    >
                      <Link href="/verify">
                        <FileCheck className="w-4 h-4 mr-2" />
                        Verify Proof
                      </Link>
                    </Button>
                  </div>

                  <div className="text-center pt-4">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setStep(1);
                        setSelectedRepo(null);
                        setGeneratedProof(null);
                      }}
                      className="text-gray-400 hover:text-white"
                    >
                      Generate Another Proof
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 