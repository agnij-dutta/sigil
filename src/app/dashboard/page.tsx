'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Header } from '@/components/ui/header';
import { WalletStatus } from '@/components/ui/wallet-status';
import { NetworkSwitcher } from '@/components/ui/network-switcher';
import CivicAuthButton from '@/components/auth/CivicAuthButton';
import GitHubAuthButton from '@/components/auth/GitHubAuthButton';
import Link from 'next/link';
import { useWallet } from '../../../web3/wallet/hooks/useWallet';
import ContributorsTable from '@/components/ui/ruixen-contributors-table';
import { AuthToken } from '@/types/auth';

import { Button } from '@/components/ui/button';
import { 
  Code2,
  GitCommit,
  Zap,
  Award,
  TrendingUp,
  Settings,
  Shield,

  Unlink,
  User,
  ExternalLink,
  Eye
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
    signOut,
    credentials,
    loadingCredentials
  } = useWallet();

  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [githubData, setGithubData] = useState<AuthToken['github'] | null>(null);
  const [loadingGithub, setLoadingGithub] = useState(false);
  const [imageError, setImageError] = useState(false);

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

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      {/* Main Dashboard Layout */}
      <div className="flex h-[calc(100vh-80px)]">
        
        {/* Sidebar - Profile & Actions */}
        <div className="w-80 p-6 border-r border-white/10 overflow-y-auto">
          <div className="space-y-6">
            
            {/* Profile Header */}
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                  {githubData?.user?.avatar_url && !imageError ? (
                    <Image
                      src={githubData.user.avatar_url}
                      alt={githubData.user.login || 'User avatar'}
                      width={48}
                      height={48}
                      className="rounded-full ring-2 ring-purple-500/20"
                      onError={handleImageError}
                      unoptimized
                      priority
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                      <User className="w-6 h-6" />
                    </div>
                  )}
                  {isAuthenticated && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-black"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold truncate">Welcome back</h3>
                  <p className="text-gray-400 text-sm truncate">
                    {githubData?.user?.name || user?.email || 'Developer'}
                  </p>
                  {githubData?.user?.login && (
                    <p className="text-purple-400 text-xs truncate">@{githubData.user.login}</p>
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
                    <Unlink className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Wallet Status Card */}
            <div className="glass-card p-4 rounded-2xl">
              <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-400" />
                Wallet & Credentials
              </h4>
              <WalletStatus 
                showBalance={true} 
                showActions={true} 
                showCredentials={true}
                className="text-gray-300"
              />
            </div>

            {/* Network Status */}
            <NetworkSwitcher />

            {/* Quick Actions */}
            <div className="glass-card p-4 rounded-2xl">
              <h4 className="text-white font-medium mb-3">Quick Actions</h4>
              <div className="space-y-2">
                <Link href="/proof/generate">
                  <Button variant="outline" className="w-full justify-start text-white border-white/20 hover:bg-white/10">
                    <Zap className="w-4 h-4 mr-2" />
                    Generate Proof
                  </Button>
                </Link>
                <Link href="/verify">
                  <Button variant="outline" className="w-full justify-start text-white border-white/20 hover:bg-white/10">
                    <Shield className="w-4 h-4 mr-2" />
                    Verify Credential
                  </Button>
                </Link>
                <Link href="/portfolio">
                  <Button variant="outline" className="w-full justify-start text-white border-white/20 hover:bg-white/10">
                    <Award className="w-4 h-4 mr-2" />
                    View Portfolio
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-6">

            {/* Auth Actions Section */}
            {!isAuthenticated && (
              <div className="glass-card p-6 rounded-2xl text-center">
                <h2 className="text-2xl font-bold text-white mb-4">Welcome to Sigil</h2>
                <p className="text-gray-300 mb-6">Connect your identity and create your verifiable developer profile</p>
                <CivicAuthButton className="mx-auto" />
              </div>
            )}

            {isAuthenticated && !hasWallet && (
              <div className="glass-card p-6 rounded-2xl text-center">
                <h2 className="text-xl font-bold text-white mb-4">Create Your Wallet</h2>
                <p className="text-gray-300 mb-6">Complete your setup by creating a secure wallet for credential management</p>
                <CivicAuthButton className="mx-auto" />
              </div>
            )}

            {isAuthenticated && hasWallet && !githubData && (
              <div className="glass-card p-6 rounded-2xl text-center">
                <h2 className="text-xl font-bold text-white mb-4">Connect GitHub</h2>
                <p className="text-gray-300 mb-6">Connect your GitHub account to start generating developer credentials</p>
                <GitHubAuthButton onSuccess={handleGithubAuthSuccess} />
              </div>
            )}

            {/* Dashboard Stats */}
            {isAuthenticated && hasWallet && githubData && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="glass-card p-4 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Shield className="w-8 h-8 text-blue-400" />
                      <div>
                        <p className="text-sm text-gray-400">Credentials</p>
                        <p className="text-xl font-bold text-white">{credentials.length}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="glass-card p-4 rounded-xl">
                    <div className="flex items-center gap-3">
                      <GitCommit className="w-8 h-8 text-green-400" />
                      <div>
                        <p className="text-sm text-gray-400">Repositories</p>
                        <p className="text-xl font-bold text-white">{repositories.length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="glass-card p-4 rounded-xl">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-8 h-8 text-purple-400" />
                      <div>
                        <p className="text-sm text-gray-400">Network</p>
                        <p className="text-lg font-bold text-white">Sepolia</p>
                      </div>
                    </div>
                  </div>

                  <div className="glass-card p-4 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Zap className="w-8 h-8 text-yellow-400" />
                      <div>
                        <p className="text-sm text-gray-400">Balance</p>
                        <p className="text-lg font-bold text-white">
                          {walletInfo.balance ? `${parseFloat(walletInfo.balance).toFixed(4)} ETH` : "0.0000 ETH"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity / Repositories */}
                <div className="glass-card p-6 rounded-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">Your Repositories</h3>
                    <Button variant="outline" size="sm" className="text-white border-white/20">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View All
                    </Button>
                  </div>
                  
                  {loadingRepos ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                      <p className="text-gray-400 mt-2">Loading repositories...</p>
                    </div>
                  ) : repositories.length > 0 ? (
                    <ContributorsTable repositories={repositories} />
                  ) : (
                    <div className="text-center py-8">
                      <Code2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400">No repositories found</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>


    </div>
  );
} 