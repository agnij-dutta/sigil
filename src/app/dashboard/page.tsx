'use client';

import { Header } from "@/components/ui/header"
import CivicAuthButton from '@/components/auth/CivicAuthButton';
import GitHubAuthButton from '@/components/auth/GitHubAuthButton';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWallet } from '../../../web3/wallet/hooks/useWallet';
import { formatWalletAddress } from '../../../web3/utils/wallet';
import { Badge } from '@/components/ui/badge';
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
  AlertCircle
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
    if (!githubData) return;
    
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

  const handleLogout = async () => {
    try {
      await signOut();
      setRepositories([]);
      setGithubData(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleGithubAuthSuccess = () => {
    fetchGithubAuth();
  };

  const handleGithubLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'github' }),
      });

      if (response.ok) {
        setGithubData(null);
        setRepositories([]);
      }
    } catch (error) {
      console.error('GitHub logout failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Sigil Dashboard
            </h1>
            <p className="text-muted-foreground">
              Build verifiable credentials from your development work
            </p>
          </div>
          <Link 
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to Home
          </Link>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex justify-between items-center">
              <p className="text-red-700">{error.message}</p>
              <button
                onClick={clearError}
                className="text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Step 1: Civic Auth - Connect Identity & Wallet */}
        {!isAuthenticated && (
          <div className="bg-card rounded-xl shadow-lg p-8 border text-center mb-8">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">
                Step 1: Connect Your Identity
              </h3>
              <p className="text-muted-foreground mb-6">
                Sign in with Civic to create your Web3 identity and wallet. 
                This will be your secure foundation for verifiable credentials.
              </p>
              <CivicAuthButton 
                className="w-full"
                onError={(error) => console.error('Auth error:', error)}
              />
            </div>
          </div>
        )}

        {/* Step 2: GitHub Auth - Connect Code Repositories */}
        {isAuthenticated && hasWallet && !githubData && (
          <div className="bg-card rounded-xl shadow-lg p-8 border text-center mb-8">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">
                Step 2: Connect Your GitHub
              </h3>
              <p className="text-muted-foreground mb-6">
                Connect your GitHub account to access your repositories and generate 
                verifiable proofs of your contributions.
              </p>
              {loadingGithub ? (
                <div className="flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
                  <span>Checking GitHub connection...</span>
                </div>
              ) : (
                <GitHubAuthButton 
                  className="w-full"
                  onSuccess={handleGithubAuthSuccess}
                  onError={(error) => console.error('GitHub auth error:', error)}
                />
              )}
            </div>
          </div>
        )}

        {/* Connected Accounts Overview */}
        {isAuthenticated && (
          <div className="bg-card rounded-xl shadow-lg p-6 border mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-foreground">Connected Accounts</h2>
              <button
                onClick={handleLogout}
                className="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition-colors"
              >
                Logout All
              </button>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Civic Profile */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-bold text-sm">1</span>
                  </div>
                  <h3 className="font-medium text-foreground">Civic Identity</h3>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Connected</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                  {user?.picture && (
                    <img 
                      src={user.picture} 
                      alt={user.name || 'User'} 
                      className="w-10 h-10 rounded-full"
                    />
                  )}
                  <div>
                    <p className="font-medium text-foreground">{user?.name || 'Anonymous User'}</p>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
              </div>

              {/* Wallet Status */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                    </svg>
                  </div>
                  <h3 className="font-medium text-foreground">Wallet</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    hasWallet ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {hasWallet ? 'Connected' : 'Not Connected'}
                  </span>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  {hasWallet ? (
                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">Address:</span> {formatWalletAddress(walletInfo.address)}
                      </div>
                      {walletInfo.balance && (
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium">Balance:</span> {parseFloat(walletInfo.balance).toFixed(4)} ETH
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">Wallet creation in progress...</div>
                  )}
                </div>
              </div>

              {/* GitHub Status */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 font-bold text-sm">2</span>
                  </div>
                  <h3 className="font-medium text-foreground">GitHub</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    githubData ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {githubData ? 'Connected' : 'Not Connected'}
                  </span>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  {githubData ? (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <img 
                          src={githubData.user.avatar_url} 
                          alt={githubData.user.login}
                          className="w-6 h-6 rounded-full"
                        />
                        <span className="text-sm font-medium">{githubData.user.login}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {githubData.user.public_repos} public repos • {githubData.user.followers} followers
                      </div>
                      <button
                        onClick={handleGithubLogout}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Disconnect GitHub
                      </button>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Connect GitHub to access repositories
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Repositories Section */}
        {isAuthenticated && hasWallet && githubData && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-foreground">Your Repositories</h2>
              <button
                onClick={fetchRepositories}
                disabled={loadingRepos}
                className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {loadingRepos ? 'Loading...' : 'Refresh'}
              </button>
            </div>
            
            {loadingRepos ? (
              <div className="text-center py-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading repositories...</p>
              </div>
            ) : (
              <ContributorsTable githubRepositories={repositories} />
            )}
          </div>
        )}

        {/* Features Preview */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-card rounded-xl p-6 border">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Proof Generation</h3>
            <p className="text-sm text-muted-foreground">
              Generate zero-knowledge proofs of your contributions without revealing code
            </p>
            <div className="mt-4">
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Coming Soon</span>
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 border">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Credential Storage</h3>
            <p className="text-sm text-muted-foreground">
              Store your verifiable credentials on IPFS with blockchain attestation
            </p>
            <div className="mt-4">
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Coming Soon</span>
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 border">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Share & Verify</h3>
            <p className="text-sm text-muted-foreground">
              Share your credentials with employers and let them verify authenticity
            </p>
            <div className="mt-4">
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Coming Soon</span>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
} 