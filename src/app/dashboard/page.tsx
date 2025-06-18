'use client';

import CivicAuthButton from '@/components/auth/CivicAuthButton';
import GitHubAuthButton from '@/components/auth/GitHubAuthButton';
import TelegramAuthButton from '@/components/auth/TelegramAuthButton';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface AuthData {
  github?: {
    user: {
      login: string;
      name: string | null;
      avatar_url: string;
      public_repos: number;
    };
    accessToken: string;
    authenticatedAt: string;
  };
  telegram?: any;
  civic?: any;
}

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
            TipDAO Dashboard
          </h1>
          <p className="text-xl text-gray-600">
            Connect your accounts to get started with meaningful collaboration
          </p>
        </div>

        {/* Connected Accounts Overview */}
        {authData && (authData.github || authData.telegram || authData.civic) && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Connected Accounts</h2>
            <div className="grid md:grid-cols-3 gap-4">
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
                  <Link 
                    href="/github"
                    className="text-xs bg-gray-900 text-white px-2 py-1 rounded hover:bg-gray-800 transition-colors"
                  >
                    View Repos
                  </Link>
                </div>
              )}
              {authData.telegram && (
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">Telegram</p>
                    <p className="text-xs text-gray-500">Connected</p>
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

        <div className="grid md:grid-cols-3 gap-8 mb-12">
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
            <CivicAuthButton 
              className="w-full"
              onSuccess={handleAuthSuccess}
              onError={(error) => console.error('Civic auth error:', error)}
            />
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
              <Link 
                href="/github"
                className="w-full inline-flex items-center justify-center px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                View Repositories ({authData.github.user.public_repos})
              </Link>
            ) : (
              <GitHubAuthButton 
                className="w-full"
                onSuccess={handleAuthSuccess}
                onError={(error) => console.error('GitHub auth error:', error)}
              />
            )}
          </div>

          {/* Telegram Section */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Telegram Connection
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Connect your Telegram to access chats and communities
              </p>
              {authData?.telegram && (
                <div className="text-xs text-green-600 mb-4 font-medium">
                  ✓ Connected
                </div>
              )}
            </div>
            <TelegramAuthButton 
              className="w-full"
              onSuccess={(user) => {
                console.log('Telegram auth success:', user);
                handleAuthSuccess();
              }}
              onError={(error) => console.error('Telegram auth error:', error)}
            />
          </div>
        </div>

        {/* Features Overview */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Platform Features
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <svg className="w-5 h-5 text-purple-600 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                Web3 Authentication
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Secure wallet-based authentication</li>
                <li>• Decentralized identity verification</li>
                <li>• Human-centered design approach</li>
                <li>• Privacy-focused connections</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <svg className="w-5 h-5 text-gray-700 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub Integration
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Complete repository access</li>
                <li>• Issues and PR management</li>
                <li>• Contribution tracking</li>
                <li>• Code collaboration tools</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/>
                </svg>
                Telegram Features
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Direct message access</li>
                <li>• Group and channel integration</li>
                <li>• Message search and analysis</li>
                <li>• Community insights</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                Collaboration Tools
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Cross-platform integration</li>
                <li>• Unified communication hub</li>
                <li>• Project coordination</li>
                <li>• Meaningful connections</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 