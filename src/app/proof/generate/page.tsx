'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Header } from "@/components/ui/header";
import { 
  ArrowLeft, 
  Download, 
  RefreshCw, 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  Zap, 
  Github,
  GitBranch,
  Star,
  Clock,
  FileCheck,
  Settings
} from 'lucide-react';
import Link from 'next/link';
import { useWallet } from '../../../../web3/wallet/hooks/useWallet';
import { ProofExplainer } from '@/components/ui/proof-explainer';

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  created_at: string;
  updated_at: string;
  private: boolean;
  owner: {
    login: string;
    avatar_url: string;
  };
}

interface GenerationOptions {
  privacyLevel: 'minimal' | 'balanced' | 'maximum';
  includeMetrics: boolean;
  includeCollaborators: boolean;
  timeRange: 'all' | '1year' | '6months' | '3months';
}

interface ProofGenerationState {
  status: 'idle' | 'generating' | 'success' | 'error';
  proof: string | null;
  error: string | null;
  progress: number;
}

export default function ProofGenerationPage() {
  const { user, isAuthenticated, hasWallet } = useWallet();
  
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [generationState, setGenerationState] = useState<ProofGenerationState>({
    status: 'idle',
    proof: null,
    error: null,
    progress: 0
  });
  const [options, setOptions] = useState<GenerationOptions>({
    privacyLevel: 'balanced',
    includeMetrics: true,
    includeCollaborators: false,
    timeRange: '1year'
  });
  const [showExplainer, setShowExplainer] = useState(false);

  useEffect(() => {
    if (isAuthenticated && hasWallet) {
      fetchRepositories();
    }
  }, [isAuthenticated, hasWallet]);

  const fetchRepositories = async () => {
    try {
      setLoadingRepos(true);
      const response = await fetch('/api/github/collaborative-repositories');
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

    setGenerationState({
      status: 'generating',
      proof: null,
      error: null,
      progress: 0
    });

    try {
      // Simulate proof generation progress
      const steps = [
        'Analyzing repository structure...',
        'Collecting commit data...',
        'Processing contribution metrics...',
        'Generating zero-knowledge proof...',
        'Finalizing credential...'
      ];

      for (let i = 0; i < steps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setGenerationState(prev => ({
          ...prev,
          progress: ((i + 1) / steps.length) * 100
        }));
      }

      // Mock proof data
      const mockProof = {
        credential: {
          '@context': ['https://www.w3.org/2018/credentials/v1'],
          type: ['VerifiableCredential', 'GitHubContributionCredential'],
          credentialSubject: {
            id: user?.email || 'developer@example.com',
            repository: selectedRepo.full_name,
            contributions: {
              commits: Math.floor(Math.random() * 100) + 50,
              linesAdded: Math.floor(Math.random() * 5000) + 1000,
              filesModified: Math.floor(Math.random() * 50) + 10,
              collaborators: options.includeCollaborators ? Math.floor(Math.random() * 5) + 1 : null
            },
            privacy: options.privacyLevel,
            timeRange: options.timeRange
          },
          issuer: 'did:web:sigil.dev',
          issuanceDate: new Date().toISOString(),
          proof: {
            type: 'ZKProof',
            proofValue: `zk_proof_${Math.random().toString(36).substring(2, 15)}`,
            verificationMethod: 'https://sigil.dev/verification'
          }
        }
      };

      setGenerationState({
        status: 'success',
        proof: JSON.stringify(mockProof, null, 2),
        error: null,
        progress: 100
      });

      setShowExplainer(true);

    } catch (error) {
      setGenerationState({
        status: 'error',
        proof: null,
        error: error instanceof Error ? error.message : 'Failed to generate proof',
        progress: 0
      });
    }
  };

  const downloadProof = () => {
    if (!generationState.proof) return;

    const blob = new Blob([generationState.proof], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedRepo?.name || 'credential'}-proof.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetGeneration = () => {
    setGenerationState({
      status: 'idle',
      proof: null,
      error: null,
      progress: 0
    });
  };

  if (!isAuthenticated || !hasWallet) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="glass-card p-8 rounded-2xl text-center max-w-md mx-auto">
            <Shield className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Authentication Required</h3>
            <p className="text-gray-400 mb-6">Please connect your identity and GitHub account to generate proofs</p>
            <Button className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600" asChild>
              <Link href="/dashboard">
                Go to Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Generate Proof</h1>
            <p className="text-gray-400">Create verifiable credentials from your development work</p>
          </div>
          
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Repository Selection */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Step 1: Select Repository */}
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <span className="text-blue-400 font-bold">1</span>
                </div>
                <h2 className="text-xl font-semibold text-white">Select Repository</h2>
              </div>
              
              {loadingRepos ? (
                <div className="text-center py-8">
                  <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-gray-400">Loading repositories...</p>
                </div>
              ) : repositories.length === 0 ? (
                <div className="text-center py-8">
                  <Github className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-400 mb-4">No repositories found</p>
                  <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" asChild>
                    <Link href="/dashboard">Connect GitHub</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid gap-3 max-h-96 overflow-y-auto">
                  {repositories.map((repo) => (
                    <div
                      key={repo.id}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        selectedRepo?.id === repo.id
                          ? 'border-purple-500/50 bg-purple-500/10'
                          : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                      }`}
                      onClick={() => setSelectedRepo(repo)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-white font-medium">{repo.name}</h3>
                          <p className="text-gray-400 text-sm">{repo.description || 'No description'}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            {repo.language && (
                              <span className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                                {repo.language}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3" />
                              {repo.stargazers_count}
                            </span>
                            <span className="flex items-center gap-1">
                              <GitBranch className="w-3 h-3" />
                              {repo.forks_count}
                            </span>
                          </div>
                        </div>
                        {selectedRepo?.id === repo.id && (
                          <CheckCircle className="w-5 h-5 text-purple-400" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Step 2: Configure Options */}
            {selectedRepo && (
              <div className="glass-card p-6 rounded-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <span className="text-purple-400 font-bold">2</span>
                  </div>
                  <h2 className="text-xl font-semibold text-white">Configure Proof</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Privacy Level</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['minimal', 'balanced', 'maximum'] as const).map((level) => (
                        <button
                          key={level}
                          onClick={() => setOptions(prev => ({ ...prev, privacyLevel: level }))}
                          className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                            options.privacyLevel === level
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                          }`}
                        >
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Time Range</label>
                    <select
                      value={options.timeRange}
                      onChange={(e) => setOptions(prev => ({ ...prev, timeRange: e.target.value as GenerationOptions['timeRange'] }))}
                      className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:border-purple-500/50 focus:outline-none"
                    >
                      <option value="all">All time</option>
                      <option value="1year">Last year</option>
                      <option value="6months">Last 6 months</option>
                      <option value="3months">Last 3 months</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={options.includeMetrics}
                        onChange={(e) => setOptions(prev => ({ ...prev, includeMetrics: e.target.checked }))}
                        className="w-4 h-4 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500/50"
                      />
                      <span className="text-sm text-gray-300">Include contribution metrics</span>
                    </label>
                    
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={options.includeCollaborators}
                        onChange={(e) => setOptions(prev => ({ ...prev, includeCollaborators: e.target.checked }))}
                        className="w-4 h-4 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500/50"
                      />
                      <span className="text-sm text-gray-300">Include collaborator information</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Generate */}
            {selectedRepo && (
              <div className="glass-card p-6 rounded-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <span className="text-green-400 font-bold">3</span>
                  </div>
                  <h2 className="text-xl font-semibold text-white">Generate Proof</h2>
                </div>

                {generationState.status === 'idle' && (
                  <Button
                    onClick={generateProof}
                    className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Generate Verifiable Credential
                  </Button>
                )}

                {generationState.status === 'generating' && (
                  <div className="space-y-4">
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${generationState.progress}%` }}
                      ></div>
                    </div>
                    <p className="text-center text-gray-400">Generating proof... {Math.round(generationState.progress)}%</p>
                  </div>
                )}

                {generationState.status === 'success' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Proof generated successfully!</span>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={downloadProof} className="flex-1">
                        <Download className="w-4 h-4 mr-2" />
                        Download Credential
                      </Button>
                      <Button onClick={resetGeneration} variant="outline" className="border-white/20 text-white hover:bg-white/10">
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {generationState.status === 'error' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-red-400">
                      <AlertCircle className="w-5 h-5" />
                      <span className="font-medium">Generation failed</span>
                    </div>
                    <p className="text-gray-400 text-sm">{generationState.error}</p>
                    <Button onClick={resetGeneration} variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                      Try Again
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar: Proof Preview */}
          <div className="space-y-6">
            <div className="glass-card p-6 rounded-2xl">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FileCheck className="w-5 h-5" />
                Proof Preview
              </h3>
              
              {!selectedRepo ? (
                <div className="text-center py-8">
                  <Settings className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">Select a repository to preview the proof structure</p>
                </div>
              ) : generationState.proof ? (
                <div>
                  <Textarea
                    value={generationState.proof}
                    readOnly
                    className="w-full h-64 text-xs font-mono bg-white/5 border-white/10 text-gray-300"
                  />
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  <div className="p-3 bg-white/5 rounded-lg">
                    <p className="text-gray-300 font-medium">Repository:</p>
                    <p className="text-purple-400">{selectedRepo.full_name}</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg">
                    <p className="text-gray-300 font-medium">Privacy Level:</p>
                    <p className="text-blue-400 capitalize">{options.privacyLevel}</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg">
                    <p className="text-gray-300 font-medium">Time Range:</p>
                    <p className="text-green-400">{options.timeRange === 'all' ? 'All time' : `Last ${options.timeRange.replace(/(\d+)/, '$1 ')}`}</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg">
                    <p className="text-gray-300 font-medium">Features:</p>
                    <div className="space-y-1 mt-1">
                      {options.includeMetrics && (
                        <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 text-xs">
                          Contribution metrics
                        </Badge>
                      )}
                      {options.includeCollaborators && (
                        <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 text-xs">
                          Collaborator info
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="glass-card p-6 rounded-2xl">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent Activity
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Last proof generated:</span>
                  <span className="text-white">2 days ago</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Total proofs:</span>
                  <span className="text-white">3</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Success rate:</span>
                  <span className="text-green-400">100%</span>
                </div>
              </div>
            </div>

            {generationState.status === 'success' && showExplainer && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-white mb-4">Understanding Your Proof</h3>
                <ProofExplainer
                  proofType={"commit"}
                  context={`This proof was generated for the repository ${selectedRepo?.full_name} with privacy level ${options.privacyLevel}.`}
                  publicSignals={[
                    `Repository: ${selectedRepo?.full_name}`,
                    `Timeframe: ${options.timeRange}`,
                    `Privacy Level: ${options.privacyLevel}`
                  ]}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 