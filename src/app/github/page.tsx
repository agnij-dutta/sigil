'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Repository } from '@/lib/github/data';
import { Header } from "@/components/ui/header";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Github, 
  Star, 
  GitBranch, 
  AlertCircle, 
  ExternalLink, 
  ArrowLeft,
  Filter,
  Activity,
  Calendar,
  Users,
  Code,
  Eye,
  Zap
} from 'lucide-react';

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
    } catch {
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
    } catch {
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
      <div className="min-h-screen bg-black">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-4">GitHub Integration</h1>
            <div className="glass-card p-6 max-w-md mx-auto rounded-2xl">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-400 mb-4">{error}</p>
              <Button asChild className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
                <Link href="/dashboard">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go to Dashboard
                </Link>
              </Button>
            </div>
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
          <div className="flex items-center space-x-4">
            {authData?.github && (
              <img
                src={authData.github.user.avatar_url}
                alt={authData.github.user.login}
                className="w-16 h-16 rounded-full border-2 border-purple-500/30"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold text-white">
                GitHub Deep Dive
              </h1>
              <p className="text-gray-400">
                {authData?.github?.user.name || authData?.github?.user.login}&apos;s Repository Analytics
              </p>
              <p className="text-purple-400 text-sm">
                {authData?.github?.user.public_repos} public repositories • {authData?.github?.user.followers || 0} followers
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        {authData?.github && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
            </div>

            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Stars</p>
                  <p className="text-2xl font-bold text-white">
                    {repositories.reduce((total, repo) => total + (repo.stargazers_count || 0), 0)}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                  <Star className="w-5 h-5 text-yellow-400" />
                </div>
              </div>
            </div>

            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Languages</p>
                  <p className="text-2xl font-bold text-white">
                    {[...new Set(repositories.map(repo => repo.language).filter(Boolean))].length}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Code className="w-5 h-5 text-purple-400" />
                </div>
              </div>
            </div>

            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Forks</p>
                  <p className="text-2xl font-bold text-white">
                    {repositories.reduce((total, repo) => total + (repo.forks_count || 0), 0)}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-400" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="glass-card p-6 rounded-2xl mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Repository Explorer</h2>
            <div className="flex items-center gap-3">
              <Button
                onClick={fetchRepositories}
                disabled={isLoading}
                variant="outline"
                size="sm"
                className="border-white/20 text-white hover:bg-white/10"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Activity className="w-4 h-4 mr-2" />
                )}
                Refresh
              </Button>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-400">Type:</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as 'all' | 'owner' | 'member')}
                className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              >
                <option value="all">All</option>
                <option value="owner">Owner</option>
                <option value="member">Member</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-400">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'updated' | 'created' | 'pushed' | 'full_name')}
                className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              >
                <option value="updated">Last updated</option>
                <option value="created">Created</option>
                <option value="pushed">Last pushed</option>
                <option value="full_name">Name</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading repositories...</p>
          </div>
        )}

        {/* Error State */}
        {error && authData && (
          <div className="glass-card p-6 rounded-2xl mb-6">
            <div className="flex items-center gap-3 text-red-400">
              <AlertCircle className="w-5 h-5" />
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Repository Grid */}
        {!isLoading && repositories.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {repositories.map((repo) => (
              <div
                key={repo.id}
                className="glass-card p-6 rounded-2xl hover:bg-white/10 transition-all duration-200 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors truncate">
                      {repo.name}
                    </h3>
                    {repo.description && (
                      <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                        {repo.description}
                      </p>
                    )}
                  </div>
                  {repo.private && (
                    <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 ml-2">
                      Private
                    </Badge>
                  )}
                </div>

                <div className="flex items-center space-x-4 text-sm text-gray-400 mb-4">
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
                      <Star className="w-4 h-4" />
                      <span>{repo.stargazers_count}</span>
                    </div>
                  )}
                  
                  {repo.forks_count > 0 && (
                    <div className="flex items-center space-x-1">
                      <GitBranch className="w-4 h-4" />
                      <span>{repo.forks_count}</span>
                    </div>
                  )}
                  
                  {repo.open_issues_count > 0 && (
                    <div className="flex items-center space-x-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>{repo.open_issues_count}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="w-3 h-3 mr-1" />
                    Updated {formatDate(repo.updated_at)}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-white" asChild>
                      <Link href={`/github/${repo.owner.login}/${repo.name}`}>
                        <Eye className="w-4 h-4" />
                      </Link>
                    </Button>
                    
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-purple-400" asChild>
                      <Link href="/proof/generate">
                        <Zap className="w-4 h-4" />
                      </Link>
                    </Button>
                    
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-white" asChild>
                      <Link href={repo.html_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && repositories.length === 0 && !error && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Github className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No repositories found</h3>
            <p className="text-gray-400 mb-4">
              Try changing your filter settings or check your GitHub account.
            </p>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 