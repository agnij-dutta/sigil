'use client';

import CivicAuthButton from '@/components/auth/CivicAuthButton';
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

  const handleLogout = async () => {
    try {
      await signOut();
      setRepositories([]);
    } catch (error) {
      console.error('Logout failed:', error);
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
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
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

        {/* Connected Account Overview */}
        {isAuthenticated && (
          <div className="bg-card rounded-xl shadow-lg p-6 border mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-foreground">Connected Account</h2>
              <button
                onClick={handleLogout}
                className="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition-colors"
              >
                Logout
              </button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* User Profile */}
              <div className="space-y-3">
                <h3 className="font-medium text-foreground">Profile</h3>
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
                <h3 className="font-medium text-foreground">Wallet</h3>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Status:</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      hasWallet ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {hasWallet ? 'Connected' : 'Not Connected'}
                    </span>
                  </div>
                  {hasWallet && (
                    <>
                      <div className="text-xs text-muted-foreground mb-1">
                        <span className="font-medium">Address:</span> {formatWalletAddress(walletInfo.address)}
                      </div>
                      {walletInfo.balance && (
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium">Balance:</span> {parseFloat(walletInfo.balance).toFixed(4)} ETH
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Authentication Section */}
        {!isAuthenticated && (
          <div className="bg-card rounded-xl shadow-lg p-8 border text-center mb-8">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">
                Connect Your Identity
              </h3>
              <p className="text-muted-foreground mb-6">
                Sign in with Civic to create verifiable credentials from your development work. 
                Your wallet will be created automatically.
              </p>
              <CivicAuthButton 
                className="w-full"
                onError={(error) => console.error('Auth error:', error)}
              />
            </div>
          </div>
        )}

        {/* Repositories Section */}
        {isAuthenticated && hasWallet && (
          <div className="bg-card rounded-xl shadow-lg p-6 border mb-8">
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
            ) : repositories.length > 0 ? (
              <div className="grid gap-4">
                {repositories.map((repo, index) => (
                  <div key={index} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-foreground">{repo.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{repo.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>★ {repo.stargazers_count}</span>
                          <span>🍴 {repo.forks_count}</span>
                          <span>{repo.language}</span>
                        </div>
                      </div>
                      <Link
                        href={`/github/${repo.owner.login}/${repo.name}`}
                        className="text-sm bg-primary text-primary-foreground px-3 py-1 rounded hover:bg-primary/90 transition-colors"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No collaborative repositories found.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Make sure you have access to private repositories and are a collaborator on some projects.
                </p>
              </div>
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
  );
} 