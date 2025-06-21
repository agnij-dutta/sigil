'use client';

import { Header } from "@/components/ui/header"
import CivicAuthButton from '@/components/auth/CivicAuthButton';
import GitHubAuthButton from '@/components/auth/GitHubAuthButton';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWallet } from '../../../web3/wallet/hooks/useWallet';
import { formatWalletAddress } from '../../../web3/utils/wallet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Github, 
  Wallet, 
  Shield, 
  FileCheck, 
  Users, 
  GitBranch, 
  TrendingUp,
  ExternalLink,
  Plus,
  CheckCircle,
  AlertCircle,
  Zap,
  Star,
  Eye,
  Settings,
  Bell,
  Search,
  Filter,
  MoreVertical,
  Code,
  Activity,
  Award,
  Clock,
  LogOut,
  Unlink
} from 'lucide-react';
import ContributorsTable from '@/components/ui/ruixen-contributors-table';
import { AuthToken } from '@/types/auth';

export default function Dashboard() {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    walletInfo, 
    hasWallet, 
    signOut,
    error,
    clearError 
  } = useWallet();

  const [repositories, setRepositories] = useState<any[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [githubData, setGithubData] = useState<AuthToken['github'] | null>(null);
  const [loadingGithub, setLoadingGithub] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && hasWallet) {
      fetchGithubAuth();
    }
  }, [isAuthenticated, hasWallet]);

  useEffect(() => {
    if (githubData) {
      fetchRepositories();
    }
  }, [githubData]);

  const fetchGithubAuth = async () => {
    try {
      setLoadingGithub(true);
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setGithubData(data.github);
      }
    } catch (error) {
      console.error('Failed to fetch GitHub auth:', error);
    } finally {
      setLoadingGithub(false);
    }
  };

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

  const handleGithubAuthSuccess = () => {
    fetchGithubAuth();
  };

  const handleGithubDisconnect = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider: 'github' }),
      });
      
      if (response.ok) {
        setGithubData(null);
        setRepositories([]);
      }
    } catch (error) {
      console.error('Failed to disconnect GitHub:', error);
    }
  };

  const handleCivicLogout = async () => {
    try {
      await signOut();
      setGithubData(null);
      setRepositories([]);
    } catch (error) {
      console.error('Failed to logout from Civic:', error);
    }
  };

  const generateProof = async (repoId: string) => {
    try {
      console.log('Generating proof for repository:', repoId);
      // TODO: Implement proof generation
    } catch (error) {
      console.error('Failed to generate proof:', error);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      {/* Main Dashboard Layout */}
      <div className="flex h-[calc(100vh-80px)]">
        
        {/* Sidebar - Connected Accounts */}
        <div className="w-80 p-6 border-r border-white/10">
          <div className="space-y-6">
            
            {/* Profile Header */}
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                  {githubData?.user?.avatar_url ? (
                    <img 
                      src={githubData.user.avatar_url} 
                      alt={githubData.user.login}
                      className="w-12 h-12 rounded-full border-2 border-purple-500/30"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                      {user?.given_name?.[0] || 'A'}
                    </div>
                  )}
                  {isAuthenticated && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-black"></div>
                  )}
                </div>
                <div>
                  <h3 className="text-white font-semibold">Welcome back</h3>
                  <p className="text-gray-400 text-sm">
                    {githubData?.user?.name || user?.email || 'Developer'}
                  </p>
                  {githubData?.user?.login && (
                    <p className="text-purple-400 text-xs">@{githubData.user.login}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  <Settings className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  <Bell className="w-4 h-4" />
                </Button>
                {isAuthenticated && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-gray-400 hover:text-red-400"
                    onClick={handleCivicLogout}
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Connection Status */}
            <div className="space-y-4">
              <h4 className="text-white font-medium flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Connected Accounts
              </h4>

              {/* Civic Identity */}
              <div className="glass-card p-4 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <Shield className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">Civic Identity</p>
                      <p className="text-gray-400 text-xs">Web3 Identity</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={isAuthenticated ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-gray-500/20 text-gray-400 border-gray-500/30"}>
                      {isAuthenticated ? 'Connected' : 'Disconnected'}
                    </Badge>
                    {isAuthenticated && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-gray-400 hover:text-red-400"
                        onClick={handleCivicLogout}
                      >
                        <LogOut className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
                {!isAuthenticated && (
                  <CivicAuthButton 
                    className="w-full"
                    onError={(error) => console.error('Auth error:', error)}
                  />
                )}
              </div>

              {/* Wallet */}
              <div className="glass-card p-4 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <Wallet className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">Wallet</p>
                      <p className="text-gray-400 text-xs">
                        {hasWallet ? formatWalletAddress(walletInfo.address) : 'Not connected'}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className={hasWallet ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-gray-500/20 text-gray-400 border-gray-500/30"}>
                    {hasWallet ? 'Connected' : 'Disconnected'}
                  </Badge>
                </div>
                {hasWallet && (
                  <div className="text-xs text-gray-400">
                    Balance: {walletInfo.balance || '0.0000'} ETH
                  </div>
                )}
              </div>

              {/* GitHub */}
              <div className="glass-card p-4 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-500/20 flex items-center justify-center">
                      <Github className="w-4 h-4 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">GitHub</p>
                      <p className="text-gray-400 text-xs">
                        {githubData ? `@${githubData.user.login}` : 'Not connected'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={githubData ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-gray-500/20 text-gray-400 border-gray-500/30"}>
                      {githubData ? 'Connected' : 'Disconnected'}
                    </Badge>
                    {githubData && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-gray-400 hover:text-red-400"
                        onClick={handleGithubDisconnect}
                      >
                        <Unlink className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
                {!githubData && isAuthenticated && hasWallet && (
                  <GitHubAuthButton 
                    className="w-full"
                    onSuccess={handleGithubAuthSuccess}
                    onError={(error) => console.error('GitHub auth error:', error)}
                  />
                )}
                {githubData && (
                  <div className="text-xs text-gray-400">
                    {repositories.length} repositories • {githubData.user.followers || 0} followers
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
              <h4 className="text-white font-medium flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Quick Actions
              </h4>
              <div className="space-y-2">
                <Button variant="ghost" className="w-full justify-start text-gray-400 hover:text-white hover:bg-white/5" asChild>
                  <Link href="/proof/generate">
                    <FileCheck className="w-4 h-4 mr-2" />
                    Generate Proof
                  </Link>
                </Button>
                <Button variant="ghost" className="w-full justify-start text-gray-400 hover:text-white hover:bg-white/5" asChild>
                  <Link href="/portfolio">
                    <Award className="w-4 h-4 mr-2" />
                    View Portfolio
                  </Link>
                </Button>
                <Button variant="ghost" className="w-full justify-start text-gray-400 hover:text-white hover:bg-white/5" asChild>
                  <Link href="/verify">
                    <Shield className="w-4 h-4 mr-2" />
                    Verify Proof
                  </Link>
                </Button>
                {githubData && (
                  <Button variant="ghost" className="w-full justify-start text-gray-400 hover:text-white hover:bg-white/5" asChild>
                    <Link href="/github">
                      <Github className="w-4 h-4 mr-2" />
                      GitHub Deep Dive
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Dashboard Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Developer Dashboard</h1>
                <p className="text-gray-400">Build verifiable credentials from your development work</p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
                <Button className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Generate Proof
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            {isAuthenticated && hasWallet && githubData && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="glass-card p-6 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Total Repositories</p>
                      <p className="text-2xl font-bold text-white">{repositories.length}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <GitBranch className="w-5 h-5 text-blue-400" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center text-xs">
                    <TrendingUp className="w-3 h-3 text-green-400 mr-1" />
                    <span className="text-green-400">+12%</span>
                    <span className="text-gray-400 ml-1">from last month</span>
                  </div>
                </div>

                <div className="glass-card p-6 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Languages Used</p>
                      <p className="text-2xl font-bold text-white">
                        {[...new Set(repositories.map(repo => repo.language).filter(Boolean))].length}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <Code className="w-5 h-5 text-purple-400" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center text-xs">
                    <Activity className="w-3 h-3 text-purple-400 mr-1" />
                    <span className="text-gray-400">JavaScript, TypeScript, Python...</span>
                  </div>
                </div>

                <div className="glass-card p-6 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Generated Proofs</p>
                      <p className="text-2xl font-bold text-white">0</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-green-400" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <Button variant="ghost" className="h-6 px-2 text-xs text-gray-400 hover:text-white" asChild>
                      <Link href="/proof/generate">Generate first proof →</Link>
                    </Button>
                  </div>
                </div>

                <div className="glass-card p-6 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Total Stars</p>
                      <p className="text-2xl font-bold text-white">
                        {repositories.reduce((total, repo) => total + (repo.stargazers_count || 0), 0)}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                      <Star className="w-5 h-5 text-orange-400" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center text-xs">
                    <Clock className="w-3 h-3 text-orange-400 mr-1" />
                    <span className="text-gray-400">Across {repositories.length} projects</span>
                  </div>
                </div>
              </div>
            )}

            {/* Setup Steps for Non-Authenticated Users */}
            {!isAuthenticated && (
              <div className="glass-card p-8 rounded-2xl text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Connect Your Identity</h3>
                <p className="text-gray-400 mb-6 max-w-md mx-auto">
                  Sign in with Civic to create your Web3 identity and wallet. This will be your secure foundation for verifiable credentials.
                </p>
                <CivicAuthButton 
                  className="mx-auto"
                  onError={(error) => console.error('Auth error:', error)}
                />
              </div>
            )}

            {isAuthenticated && hasWallet && !githubData && (
              <div className="glass-card p-8 rounded-2xl text-center">
                <div className="w-16 h-16 bg-gray-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Github className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Connect Your GitHub</h3>
                <p className="text-gray-400 mb-6 max-w-md mx-auto">
                  Connect your GitHub account to access your repositories and generate verifiable proofs of your contributions.
                </p>
                {loadingGithub ? (
                  <div className="flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mr-3"></div>
                    <span className="text-gray-400">Checking GitHub connection...</span>
                  </div>
                ) : (
                  <GitHubAuthButton 
                    className="mx-auto"
                    onSuccess={handleGithubAuthSuccess}
                    onError={(error) => console.error('GitHub auth error:', error)}
                  />
                )}
              </div>
            )}

            {/* Repository Projects Table */}
            {isAuthenticated && hasWallet && githubData && (
              <div className="glass-card p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-white">Your Projects</h2>
                    <p className="text-gray-400 text-sm">Manage and generate proofs for your repositories</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                      <Filter className="w-4 h-4 mr-2" />
                      Filter
                    </Button>
                    <Button
                      onClick={fetchRepositories}
                      disabled={loadingRepos}
                      variant="outline"
                      size="sm"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      {loadingRepos ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      ) : (
                        <Activity className="w-4 h-4 mr-2" />
                      )}
                      Refresh
                    </Button>
                  </div>
                </div>
                
                <ContributorsTable repositories={repositories} loading={loadingRepos} />
                
                {!loadingRepos && repositories.length === 0 && (
                  <div className="text-center py-12">
                    <Github className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">No repositories found</h3>
                    <p className="text-gray-400">We couldn't find any repositories in your GitHub account.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 