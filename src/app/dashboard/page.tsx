'use client';

import CivicAuthButton from '@/components/auth/CivicAuthButton';
import GitHubAuthButton from '@/components/auth/GitHubAuthButton';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from "@civic/auth-web3/react";
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

import { AuthToken } from '@/types/auth';

type AuthData = AuthToken;

export default function Dashboard() {
  const [authData, setAuthData] = useState<AuthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [repositories, setRepositories] = useState<any[]>([]);
  const [collaborativeRepos, setCollaborativeRepos] = useState<any[]>([]);
  const { user: civicUser } = useUser();

  useEffect(() => {
    fetchAuthData();
  }, []);

  useEffect(() => {
    if (authData?.github) {
      fetchRepositories();
      fetchCollaborativeRepositories();
    }
  }, [authData]);

  const fetchAuthData = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setAuthData(data);
      }
    } catch (error) {
      console.error('Failed to fetch auth data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRepositories = async () => {
    try {
      const response = await fetch('/api/github/repositories?per_page=5');
      if (response.ok) {
        const repos = await response.json();
        setRepositories(repos);
      }
    } catch (error) {
      console.error('Failed to fetch repositories:', error);
    }
  };

  const fetchCollaborativeRepositories = async () => {
    try {
      const response = await fetch('/api/github/collaborative-repositories?per_page=5');
      if (response.ok) {
        const data = await response.json();
        setCollaborativeRepos(data.repositories || []);
      }
    } catch (error) {
      console.error('Failed to fetch collaborative repositories:', error);
    }
  };

  const handleAuthSuccess = () => {
    // Refresh auth data when any authentication succeeds
    fetchAuthData();
  };

  const handleLogout = async (provider?: string) => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider }),
      });

      if (response.ok) {
        // Refresh the page to ensure clean state
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
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
              Manage your verified developer credentials and connections
            </p>
          </div>
          {authData && (authData.github || civicUser) && (
            <button
              onClick={() => handleLogout()}
              className="mt-4 sm:mt-0 text-sm bg-destructive hover:bg-destructive/90 text-destructive-foreground px-4 py-2 rounded-lg transition-colors"
            >
              Logout All
            </button>
          )}
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card border rounded-xl p-6">
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                authData?.github ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'
              }`}>
                <Github className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">GitHub</h3>
                <p className="text-xs text-muted-foreground">
                  {authData?.github ? 'Connected' : 'Not connected'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-6">
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                civicUser ? 'bg-purple-100 text-purple-600' : 'bg-muted text-muted-foreground'
              }`}>
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Web3 Wallet</h3>
                <p className="text-xs text-muted-foreground">
                  {civicUser ? 'Connected' : 'Not connected'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-lg bg-muted text-muted-foreground flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Credentials</h3>
                <p className="text-xs text-muted-foreground">
                  Coming soon
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Account Connection */}
        {(!authData?.github && !civicUser) && (
          <div className="bg-card border rounded-xl p-8 mb-8 text-center">
            <div className="max-w-md mx-auto">
              <h2 className="text-xl font-semibold mb-2">Get Started</h2>
              <p className="text-muted-foreground mb-6">
                Connect your accounts to start building verifiable developer credentials
              </p>
              <div className="space-y-3">
                <GitHubAuthButton 
                  className="w-full"
                  onSuccess={handleAuthSuccess}
                  onError={(error: Error) => console.error('GitHub auth error:', error)}
                />
                <div className="text-sm text-muted-foreground">or</div>
                <CivicAuthButton 
                  className="w-full"
                  onSuccess={handleAuthSuccess}
                  onError={(error: Error) => console.error('Civic auth error:', error)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Connected Accounts Management */}
        {(authData?.github || civicUser) && (
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* GitHub Account */}
            {authData?.github && (
              <div className="bg-card border rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <img 
                      src={authData.github.user.avatar_url} 
                      alt={authData.github.user.login}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <h3 className="font-semibold">{authData.github.user.name || authData.github.user.login}</h3>
                      <p className="text-sm text-muted-foreground">GitHub Account</p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Connected
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-lg font-semibold">{authData.github.user.public_repos}</div>
                    <div className="text-xs text-muted-foreground">Public Repos</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-lg font-semibold">{authData.github.user.followers}</div>
                    <div className="text-xs text-muted-foreground">Followers</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Link 
                    href="/github"
                    className="w-full inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 font-medium rounded-lg transition-colors"
                  >
                    <Github className="w-4 h-4 mr-2" />
                    View Repositories
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </Link>
                  <button
                    onClick={() => handleLogout('github')}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground font-medium rounded-lg transition-colors"
                  >
                    Disconnect GitHub
                  </button>
                </div>
              </div>
            )}

            {/* Civic Auth Account */}
            {civicUser && (
              <div className="bg-card border rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{civicUser.name || 'Web3 User'}</h3>
                      <p className="text-sm text-muted-foreground">Civic Wallet</p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Connected
                  </Badge>
                </div>
                
                <div className="mb-4 p-3 bg-muted rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">User ID</div>
                  <div className="text-sm font-mono">{civicUser.id}</div>
                </div>

                <CivicAuthButton 
                  className="w-full"
                  onSuccess={handleAuthSuccess}
                  onError={(error: Error) => console.error('Civic auth error:', error)}
                />
              </div>
            )}

            {/* Connect Missing Account */}
            {(!authData?.github || !civicUser) && (
              <div className="bg-card border rounded-xl p-6">
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mx-auto">
                    <Plus className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Connect Additional Account</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {!authData?.github && !civicUser 
                        ? "Connect both accounts for full functionality"
                        : !authData?.github 
                        ? "Connect GitHub to access your repositories"
                        : "Connect your wallet for Web3 identity"}
                    </p>
                  </div>
                  
                  {!authData?.github && (
                    <GitHubAuthButton 
                      className="w-full"
                      onSuccess={handleAuthSuccess}
                      onError={(error: Error) => console.error('GitHub auth error:', error)}
                    />
                  )}
                  
                  {!civicUser && (
                    <CivicAuthButton 
                      className="w-full"
                      onSuccess={handleAuthSuccess}
                      onError={(error: Error) => console.error('Civic auth error:', error)}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Repository Overview */}
        {authData?.github && repositories.length > 0 && (
          <div className="bg-card border rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Recent Repositories</h2>
              <Link 
                href="/github"
                className="text-sm text-primary hover:text-primary/80 flex items-center"
              >
                View All
                <ExternalLink className="w-3 h-3 ml-1" />
              </Link>
            </div>
            
            <div className="grid gap-4">
              {repositories.slice(0, 3).map((repo) => (
                <div key={repo.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center space-x-3">
                    <GitBranch className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <h3 className="font-medium">{repo.name}</h3>
                      <p className="text-sm text-muted-foreground">{repo.description || 'No description'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    {repo.language && (
                      <span className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mr-1"></div>
                        {repo.language}
                      </span>
                    )}
                    <span className="flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {repo.stargazers_count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Collaborative Repositories */}
        {authData?.github && collaborativeRepos.length > 0 && (
          <div className="bg-card border rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Collaborative Repositories</h2>
              <Badge variant="outline">Private Access</Badge>
            </div>
            
            <div className="grid gap-4">
              {collaborativeRepos.slice(0, 3).map((repo) => (
                <div key={repo.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Users className="w-4 h-4 text-purple-600" />
                    <div>
                      <h3 className="font-medium">{repo.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {repo.owner.login} • {repo.description || 'No description'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="text-xs">
                      {repo.permissions?.admin ? 'Admin' : repo.permissions?.push ? 'Write' : 'Read'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next Steps */}
        <div className="bg-card border rounded-xl p-8">
          <div className="text-center space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Ready to Generate Proofs?</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                With your accounts connected, you can now generate cryptographic proofs of your contributions 
                without exposing any source code. Build verifiable developer credentials that showcase your work.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mx-auto">
                  <FileCheck className="w-6 h-6" />
                </div>
                <h3 className="font-medium">Select Repository</h3>
                <p className="text-sm text-muted-foreground">Choose which repo to verify</p>
              </div>
              
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mx-auto">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="font-medium">Generate Proof</h3>
                <p className="text-sm text-muted-foreground">Create cryptographic evidence</p>
              </div>
              
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mx-auto">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="font-medium">Share Credentials</h3>
                <p className="text-sm text-muted-foreground">Present verifiable work history</p>
              </div>
            </div>
            
            <div className="pt-4">
              <div className="inline-flex items-center px-4 py-2 bg-muted rounded-lg text-sm text-muted-foreground">
                <AlertCircle className="w-4 h-4 mr-2" />
                Zero-knowledge proof generation coming soon
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 