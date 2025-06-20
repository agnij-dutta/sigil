'use client';

import CivicAuthButton from '@/components/auth/CivicAuthButton';
import GitHubAuthButton from '@/components/auth/GitHubAuthButton';
import { useState, useEffect } from 'react';
import Link from 'next/link';

import { AuthToken } from '@/types/auth';

type AuthData = AuthToken;

export default function Dashboard() {
  const [authData, setAuthData] = useState<AuthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAuthData();
  }, []);

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Sigil Dashboard
          </h1>
          <p className="text-xl text-gray-600">
            Connect your accounts to get started with meaningful collaboration
          </p>
        </div>

        {/* Connected Accounts Overview */}
        {authData && (authData.github || authData.civic) && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Connected Accounts</h2>
              <button
                onClick={() => handleLogout()}
                className="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition-colors"
              >
                Logout All
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {authData.github && (
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <img 
                    src={authData.github.user.avatar_url} 
                    alt={authData.github.user.login}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {authData.github.user.name || authData.github.user.login}
                    </p>
                    <p className="text-xs text-gray-500">GitHub Connected</p>
                  </div>
                  <div className="flex space-x-1">
                    <Link 
                      href="/github"
                      className="text-xs bg-gray-900 text-white px-2 py-1 rounded hover:bg-gray-800 transition-colors"
                    >
                      View Repos
                    </Link>
                    <button
                      onClick={() => handleLogout('github')}
                      className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
              {authData.civic && (
                <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">Web3 ID</p>
                    <p className="text-xs text-gray-500">Connected</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Civic Auth Section */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Web3 Identity
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Connect your wallet for secure, decentralized authentication
              </p>
              {authData?.civic && (
                <div className="text-xs text-green-600 mb-4 font-medium">
                  ✓ Connected
                </div>
              )}
            </div>
            {authData?.civic ? (
              <button
                onClick={() => handleLogout('civic')}
                className="w-full inline-flex items-center justify-center px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Disconnect Wallet
              </button>
            ) : (
              <CivicAuthButton 
                className="w-full"
                onSuccess={handleAuthSuccess}
                onError={(error: Error) => console.error('Civic auth error:', error)}
              />
            )}
          </div>

          {/* GitHub Section */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                GitHub Integration
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Access your repositories, issues, PRs, and contributions
              </p>
              {authData?.github && (
                <div className="text-xs text-green-600 mb-4 font-medium">
                  ✓ Connected as {authData.github.user.login}
                </div>
              )}
            </div>
            {authData?.github ? (
              <div className="space-y-2">
                <Link 
                  href="/github"
                  className="w-full inline-flex items-center justify-center px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  View Repositories ({authData.github.user.public_repos})
                </Link>
                <button
                  onClick={() => handleLogout('github')}
                  className="w-full inline-flex items-center justify-center px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Disconnect GitHub
                </button>
              </div>
            ) : (
              <GitHubAuthButton 
                className="w-full"
                onSuccess={handleAuthSuccess}
                onError={(error: Error) => console.error('GitHub auth error:', error)}
              />
            )}
          </div>
        </div>

        {/* Features Overview */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Build Meaningful Connections
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Sigil helps you discover and connect with developers who share your interests, 
              collaborate on projects, and build lasting professional relationships.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Repository Collaboration
                </h3>
                <p className="text-gray-600">
                  Connect your GitHub account to discover repositories, track contributions, 
                  and find collaborators for your projects.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Secure Identity
                </h3>
                <p className="text-gray-600">
                  Use Web3 authentication to maintain a verified, portable digital identity 
                  across all your professional interactions.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        {(!authData || (!authData.github && !authData.civic)) && (
          <div className="text-center mt-12">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Get Started
            </h3>
            <p className="text-gray-600 mb-6">
              Connect at least one account to start building meaningful professional connections.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!authData?.github && (
                <GitHubAuthButton 
                  onSuccess={handleAuthSuccess}
                  onError={(error: Error) => console.error('GitHub auth error:', error)}
                />
              )}
              {!authData?.civic && (
                <CivicAuthButton 
                  onSuccess={handleAuthSuccess}
                  onError={(error: Error) => console.error('Civic auth error:', error)}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 