'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Repository } from '@/lib/github/data';

interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
  html_url: string;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
}

interface AuthData {
  github?: {
    user: GitHubUser;
    accessToken: string;
    authenticatedAt: string;
  };
}

export default function GitHubRepositoriesPage() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [authData, setAuthData] = useState<AuthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'owner' | 'member'>('all');
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'pushed' | 'full_name'>('updated');

  useEffect(() => {
    fetchAuthData();
  }, []);

  useEffect(() => {
    if (authData?.github) {
      fetchRepositories();
    }
  }, [authData, filter, sortBy]);

  const fetchAuthData = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setAuthData(data);
      } else {
        setError('Please connect your GitHub account first');
        setIsLoading(false);
      }
    } catch (err) {
      setError('Failed to fetch authentication data');
      setIsLoading(false);
    }
  };

  const fetchRepositories = async () => {
    if (!authData?.github) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/github/repositories?type=${filter}&sort=${sortBy}&direction=desc&per_page=50`);
      if (response.ok) {
        const data = await response.json();
        setRepositories(data);
      } else {
        setError('Failed to fetch repositories');
      }
    } catch (err) {
      setError('Failed to fetch repositories');
    } finally {
      setIsLoading(false);
    }
  };

  const getLanguageColor = (language: string | null) => {
    const colors: { [key: string]: string } = {
      JavaScript: '#f1e05a',
      TypeScript: '#2b7489',
      Python: '#3572A5',
      Java: '#b07219',
      'C++': '#f34b7d',
      C: '#555555',
      'C#': '#239120',
      PHP: '#4F5D95',
      Ruby: '#701516',
      Go: '#00ADD8',
      Rust: '#dea584',
      Swift: '#ffac45',
      Kotlin: '#F18E33',
      Dart: '#00B4AB',
      HTML: '#e34c26',
      CSS: '#1572B6',
      Shell: '#89e051',
      Vue: '#4FC08D',
      React: '#61DAFB',
    };
    return colors[language || ''] || '#6b7280';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (error && !authData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">GitHub Integration</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
            <p className="text-red-700 mb-4">{error}</p>
            <Link 
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          {authData?.github && (
            <img
              src={authData.github.user.avatar_url}
              alt={authData.github.user.login}
              className="w-12 h-12 rounded-full border-2 border-gray-200"
            />
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {authData?.github?.user.name || authData?.github?.user.login}'s Repositories
            </h1>
            <p className="text-gray-600">
              {authData?.github?.user.public_repos} public repositories
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard"
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Type:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'owner' | 'member')}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All</option>
            <option value="owner">Owner</option>
            <option value="member">Member</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'updated' | 'created' | 'pushed' | 'full_name')}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="updated">Last updated</option>
            <option value="created">Created</option>
            <option value="pushed">Last pushed</option>
            <option value="full_name">Name</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading repositories...</p>
        </div>
      )}

      {/* Error State */}
      {error && authData && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Repository Grid */}
      {!isLoading && repositories.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {repositories.map((repo) => (
            <Link
              key={repo.id}
              href={`/github/${repo.owner.login}/${repo.name}`}
              className="block bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-blue-600 hover:text-blue-800 truncate">
                    {repo.name}
                  </h3>
                  {repo.description && (
                    <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                      {repo.description}
                    </p>
                  )}
                </div>
                {repo.private && (
                  <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                    Private
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                {repo.language && (
                  <div className="flex items-center space-x-1">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getLanguageColor(repo.language) }}
                    ></div>
                    <span>{repo.language}</span>
                  </div>
                )}
                
                {repo.stargazers_count > 0 && (
                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span>{repo.stargazers_count}</span>
                  </div>
                )}
                
                {repo.forks_count > 0 && (
                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414L2.586 8l3.707-3.707a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>{repo.forks_count}</span>
                  </div>
                )}
                
                {repo.open_issues_count > 0 && (
                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                    <span>{repo.open_issues_count}</span>
                  </div>
                )}
              </div>

              <div className="text-xs text-gray-500">
                Updated {formatDate(repo.updated_at)}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && repositories.length === 0 && !error && (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2M4 13h2m13-8l-8 8-4-4"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No repositories found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try changing your filter settings or check your GitHub account.
          </p>
        </div>
      )}
    </div>
  );
} 