'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Header } from '@/components/ui/header';
import CivicAuthButton from '@/components/auth/CivicAuthButton';
import GitHubAuthButton from '@/components/auth/GitHubAuthButton';
import Link from 'next/link';
import { useWallet } from '../../../web3/wallet/hooks/useWallet';
import ContributorsTable from '@/components/ui/ruixen-contributors-table';
import { AuthToken } from '@/types/auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  GitBranch, 
  Star, 
  Eye,
  Code2,
  GitCommit,
  Zap,
  Award,
  TrendingUp,
  Settings,
  ChevronRight,
  Shield,
  Lock,
  Unlock,
  Link as LinkIcon,
  Unlink,
  Plus
} from 'lucide-react';

// GitHub Repository interface to replace any type
interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  private: boolean;
  owner: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
}

export default function Dashboard() {
  const { 
    user, 
    isAuthenticated, 
    walletInfo, 
    hasWallet, 
    signOut
  } = useWallet();

  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [githubData, setGithubData] = useState<AuthToken['github'] | null>(null);
  const [loadingGithub, setLoadingGithub] = useState(false);

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
                    <Image
                      src={githubData.user.avatar_url}
                      alt={githubData.user.login}
                      width={48}
                      height={48}
                      className="rounded-full"
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
                  <Eye className="w-4 h-4" />
                </Button>
                {isAuthenticated && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-gray-400 hover:text-red-400"
                    onClick={handleCivicLogout}
                  >
                    <Unlock className="w-4 h-4" />
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
                        <Unlock className="w-3 h-3" />
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
                      <Lock className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">Wallet</p>
                      <p className="text-gray-400 text-xs">
                        {hasWallet ? walletInfo?.address : 'Not connected'}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className={hasWallet ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-gray-500/20 text-gray-400 border-gray-500/30"}>
                    {hasWallet ? 'Connected' : 'Disconnected'}
                  </Badge>
                </div>
                {hasWallet && walletInfo && (
                  <div className="text-xs text-gray-400">
                    Balance: {walletInfo.balance || '0'} ETH
                  </div>
                )}
              </div>

              {/* GitHub */}
              <div className="glass-card p-4 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-500/20 flex items-center justify-center">
                      <GitBranch className="w-4 h-4 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">GitHub</p>
                      <p className="text-gray-400 text-xs">
                        {githubData?.user?.login || 'Not connected'}
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
                {!githubData && isAuthenticated && (
                  <GitHubAuthButton 
                    className="w-full"
                    onSuccess={handleGithubAuthSuccess}
                  />
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
              <h4 className="text-white font-medium flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Quick Actions
              </h4>
              
              <div className="space-y-2">
                <Link href="/proof/generate">
                  <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-white/10">
                    <LinkIcon className="w-4 h-4 mr-3" />
                    Generate Proof
                  </Button>
                </Link>
                
                <Link href="/portfolio">
                  <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-white/10">
                    <Award className="w-4 h-4 mr-3" />
                    View Portfolio
                  </Button>
                </Link>
                
                <Link href="/verify">
                  <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-white/10">
                    <Shield className="w-4 h-4 mr-3" />
                    Verify Proof
                  </Button>
                </Link>
                
                <Link href="/github">
                  <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-white/10">
                    <GitBranch className="w-4 h-4 mr-3" />
                    GitHub Deep Dive
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-6 overflow-hidden">
          <div className="h-full flex flex-col">
            
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              
              {/* Total Repositories */}
              <div className="glass-card p-6 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-white">{repositories.length}</h3>
                    <p className="text-gray-400 text-sm">Total Repositories</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center">
                    <GitBranch className="w-6 h-6 text-blue-400" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="text-green-400">+12%</span>
                    <span className="text-gray-400">vs last month</span>
                  </div>
                </div>
              </div>

              {/* Total Stars */}
              <div className="glass-card p-6 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      {repositories.reduce((acc, repo) => acc + repo.stargazers_count, 0)}
                    </h3>
                    <p className="text-gray-400 text-sm">Total Stars</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-500/20 rounded-2xl flex items-center justify-center">
                    <Star className="w-6 h-6 text-yellow-400" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="text-green-400">+8%</span>
                    <span className="text-gray-400">this week</span>
                  </div>
                </div>
              </div>

              {/* Active Languages */}
              <div className="glass-card p-6 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      {new Set(repositories.map(repo => repo.language).filter(Boolean)).size}
                    </h3>
                    <p className="text-gray-400 text-sm">Active Languages</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center">
                    <Code2 className="w-6 h-6 text-purple-400" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center gap-2 text-sm">
                    <GitCommit className="w-4 h-4 text-blue-400" />
                    <span className="text-blue-400">TypeScript</span>
                    <span className="text-gray-400">most used</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Projects Section */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Your Projects</h2>
                  <p className="text-gray-400">Manage and generate proofs for your repositories</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                    <ChevronRight className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                  
                  <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                    <Eye className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                  
                  <Button variant="outline" size="sm" className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10">
                    <Plus className="w-4 h-4 mr-2" />
                    Columns
                  </Button>
                </div>
              </div>

              {/* Contributors Table */}
              <div className="flex-1 min-h-0">
                {!githubData ? (
                  <div className="glass-card rounded-2xl p-12 text-center">
                    <div className="w-16 h-16 bg-gray-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <GitBranch className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Connect GitHub</h3>
                    <p className="text-gray-400 mb-6">Connect your GitHub account to view and manage your repositories</p>
                    {isAuthenticated && (
                      <GitHubAuthButton 
                        className="mx-auto"
                        onSuccess={handleGithubAuthSuccess}
                      />
                    )}
                    {!isAuthenticated && (
                      <div className="space-y-4">
                        <p className="text-sm text-gray-500">First, connect your Civic Identity</p>
                        <CivicAuthButton 
                          className="mx-auto"
                          onError={(error) => console.error('Auth error:', error)}
                        />
                      </div>
                    )}
                  </div>
                ) : loadingRepos || loadingGithub ? (
                  <div className="glass-card rounded-2xl p-12 text-center">
                    <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading your repositories...</p>
                  </div>
                ) : (
                  <ContributorsTable 
                    repositories={repositories}
                    loading={loadingRepos}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-4">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center gap-4">
            <p>&copy; 2024 Sigil. All rights reserved.</p>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/support" className="hover:text-white transition-colors">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
} 