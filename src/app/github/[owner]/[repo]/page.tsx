'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { 
  Repository, 
  Issue, 
  PullRequest, 
  Commit, 
  Collaborator, 
  Branch, 
  Release 
} from '@/lib/github/data';
import { Header } from '@/components/ui/header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  ExternalLink, 
  Star, 
  GitBranch, 
  Eye, 
  AlertCircle, 
  GitPullRequest, 
  GitCommit, 
  Users, 
  Calendar, 
  Clock,
  Lock,
  Globe,
  Code,
  Package,
  MessageCircle,
  CheckCircle,
  XCircle,
  GitMerge,
  FileText,
  Shield,
  Zap
} from 'lucide-react';

type TabType = 'overview' | 'issues' | 'pulls' | 'commits' | 'collaborators' | 'branches' | 'releases';

export default function RepositoryDetailsPage() {
  const params = useParams();
  const owner = params.owner as string;
  const repo = params.repo as string;

  const [repository, setRepository] = useState<Repository | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [releases, setReleases] = useState<Release[]>([]);
  
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRepositoryData = useCallback(async () => {
    if (!owner || !repo) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/github/repositories/${owner}/${repo}`);
      if (response.ok) {
        const data = await response.json();
        setRepository(data);
      } else {
        setError('Failed to fetch repository details');
      }
    } catch {
      setError('Failed to fetch repository details');
    } finally {
      setIsLoading(false);
    }
  }, [owner, repo]);

  const fetchTabData = useCallback(async (tab: TabType) => {
    if (!owner || !repo) return;
    
    try {
      setIsLoading(true);
      let endpoint = '';
      switch (tab) {
        case 'issues':
          endpoint = `/api/github/repositories/${owner}/${repo}/issues`;
          break;
        case 'pulls':
          endpoint = `/api/github/repositories/${owner}/${repo}/pulls`;
          break;
        case 'commits':
          endpoint = `/api/github/repositories/${owner}/${repo}/commits`;
          break;
        case 'collaborators':
          endpoint = `/api/github/repositories/${owner}/${repo}/collaborators`;
          break;
        case 'branches':
          endpoint = `/api/github/repositories/${owner}/${repo}/branches`;
          break;
        case 'releases':
          endpoint = `/api/github/repositories/${owner}/${repo}/releases`;
          break;
      }

      if (endpoint) {
        const response = await fetch(endpoint);
        if (response.ok) {
          const data = await response.json();
          switch (tab) {
            case 'issues':
              setIssues(data);
              break;
            case 'pulls':
              setPullRequests(data);
              break;
            case 'commits':
              setCommits(data);
              break;
            case 'collaborators':
              setCollaborators(data);
              break;
            case 'branches':
              setBranches(data);
              break;
            case 'releases':
              setReleases(data);
              break;
          }
        }
      }
    } catch (err) {
      console.error(`Failed to fetch ${tab} data:`, err);
    } finally {
      setIsLoading(false);
    }
  }, [owner, repo]);

  useEffect(() => {
    fetchRepositoryData();
  }, [fetchRepositoryData]);

  useEffect(() => {
    fetchTabData(activeTab);
  }, [fetchTabData, activeTab]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="glass-card p-8 rounded-2xl text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-4"></div>
            <p className="text-gray-300">Loading repository...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !repository) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="glass-card p-8 rounded-2xl text-center max-w-md mx-auto">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-400 mb-6">{error || 'Repository not found'}</p>
            <Button asChild className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
              <Link href="/github">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Repositories
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'issues', label: `Issues (${repository.open_issues_count})`, icon: AlertCircle },
    { id: 'pulls', label: 'Pull Requests', icon: GitPullRequest },
    { id: 'commits', label: 'Commits', icon: GitCommit },
    { id: 'collaborators', label: 'Collaborators', icon: Users },
    { id: 'branches', label: 'Branches', icon: GitBranch },
    { id: 'releases', label: 'Releases', icon: Package },
  ] as const;

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-400 mb-6">
          <Link href="/github" className="hover:text-purple-400 transition-colors">Repositories</Link>
          <span>/</span>
          <Link href={`/github/${owner}`} className="hover:text-purple-400 transition-colors">{owner}</Link>
          <span>/</span>
          <span className="text-white font-medium">{repo}</span>
        </div>
        
        {/* Repository Header */}
        <div className="glass-card p-8 rounded-2xl mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-4">
                <h1 className="text-4xl font-bold text-white">
                  {repository.name}
                </h1>
                {repository.private ? (
                  <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                    <Lock className="w-3 h-3 mr-1" />
                    Private
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                    <Globe className="w-3 h-3 mr-1" />
                    Public
                  </Badge>
                )}
              </div>
              
              {repository.description && (
                <p className="text-gray-300 text-lg mb-6">{repository.description}</p>
              )}
              
              {/* Repository Stats */}
              <div className="flex flex-wrap items-center gap-6 text-sm">
                {repository.language && (
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getLanguageColor(repository.language) }}
                    ></div>
                    <span className="text-gray-300">{repository.language}</span>
                  </div>
                )}
                
                <div className="flex items-center space-x-2 text-gray-300">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span>{repository.stargazers_count.toLocaleString()}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-gray-300">
                  <GitBranch className="w-4 h-4 text-blue-400" />
                  <span>{repository.forks_count.toLocaleString()}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-gray-300">
                  <Eye className="w-4 h-4 text-gray-400" />
                  <span>{repository.watchers_count.toLocaleString()}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-gray-300">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>Updated {formatDate(repository.updated_at)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button asChild variant="outline" className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10">
                <a href={repository.html_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on GitHub
                </a>
              </Button>
              <Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/10">
                <Link href="/github">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="glass-card rounded-2xl overflow-hidden mb-8">
          <div className="border-b border-white/10">
            <nav className="flex overflow-x-auto">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`flex items-center space-x-2 px-6 py-4 font-medium text-sm whitespace-nowrap transition-all ${
                      activeTab === tab.id
                        ? 'border-b-2 border-purple-500 text-purple-400 bg-purple-500/10'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="glass-card p-6 rounded-xl">
                    <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                      <Code className="w-5 h-5 mr-2 text-purple-400" />
                      Repository Information
                    </h3>
                    <dl className="grid grid-cols-1 gap-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-400">Full Name</dt>
                        <dd className="text-gray-300 font-mono">{repository.full_name}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-400">Clone URL</dt>
                        <dd className="text-gray-300 font-mono text-sm break-all bg-black/30 p-2 rounded">{repository.clone_url}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-400">SSH URL</dt>
                        <dd className="text-gray-300 font-mono text-sm break-all bg-black/30 p-2 rounded">{repository.ssh_url}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-400">Default Branch</dt>
                        <dd>
                          <Badge variant="outline" className="border-blue-500/30 text-blue-400">
                            <GitBranch className="w-3 h-3 mr-1" />
                            {repository.default_branch}
                          </Badge>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-400">Created</dt>
                        <dd className="text-gray-300">{formatDate(repository.created_at)}</dd>
                      </div>
                      {repository.pushed_at && (
                        <div>
                          <dt className="text-sm font-medium text-gray-400">Last Push</dt>
                          <dd className="text-gray-300">{formatDate(repository.pushed_at)}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="glass-card p-6 rounded-xl">
                    <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                      <Zap className="w-5 h-5 mr-2 text-purple-400" />
                      Quick Stats
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 flex items-center">
                          <Star className="w-4 h-4 mr-2 text-yellow-400" />
                          Stars
                        </span>
                        <span className="font-medium text-white">{repository.stargazers_count.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 flex items-center">
                          <Eye className="w-4 h-4 mr-2 text-gray-400" />
                          Watchers
                        </span>
                        <span className="font-medium text-white">{repository.watchers_count.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 flex items-center">
                          <GitBranch className="w-4 h-4 mr-2 text-blue-400" />
                          Forks
                        </span>
                        <span className="font-medium text-white">{repository.forks_count.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-2 text-red-400" />
                          Open Issues
                        </span>
                        <span className="font-medium text-white">{repository.open_issues_count.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 flex items-center">
                          {repository.private ? <Lock className="w-4 h-4 mr-2 text-yellow-400" /> : <Globe className="w-4 h-4 mr-2 text-green-400" />}
                          Visibility
                        </span>
                        <span className="font-medium text-white">{repository.private ? 'Private' : 'Public'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'issues' && (
              <div className="space-y-4">
                {issues.length > 0 ? (
                  issues.map((issue) => (
                    <div key={issue.id} className="glass-card p-6 rounded-xl">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <Badge variant={issue.state === 'open' ? 'default' : 'secondary'} 
                                   className={issue.state === 'open' 
                                     ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                                     : 'bg-red-500/20 text-red-400 border-red-500/30'}>
                              {issue.state === 'open' ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                              {issue.state}
                            </Badge>
                            <span className="text-gray-400 text-sm">#{issue.number}</span>
                          </div>
                          <h4 className="text-lg font-medium text-white mb-2 hover:text-purple-400 transition-colors">
                            <a href={issue.html_url} target="_blank" rel="noopener noreferrer">
                              {issue.title}
                            </a>
                          </h4>
                          {issue.body && (
                            <p className="text-gray-400 text-sm line-clamp-2 mb-3">{issue.body}</p>
                          )}
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <span>by {issue.user.login}</span>
                            <span className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {formatDate(issue.created_at)}
                            </span>
                            {issue.comments > 0 && (
                              <span className="flex items-center">
                                <MessageCircle className="w-3 h-3 mr-1" />
                                {issue.comments} comments
                              </span>
                            )}
                          </div>
                        </div>
                        <Image
                          src={issue.user.avatar_url}
                          alt={issue.user.login}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full border-2 border-purple-500/30"
                        />
                      </div>
                      {issue.labels.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {issue.labels.map((label, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs"
                              style={{ 
                                borderColor: `#${label.color}`,
                                color: `#${label.color}`,
                                backgroundColor: `#${label.color}20`
                              }}
                            >
                              {label.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No issues found</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'pulls' && (
              <div className="space-y-4">
                {pullRequests.length > 0 ? (
                  pullRequests.map((pr) => (
                    <div key={pr.id} className="glass-card p-6 rounded-xl">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <Badge variant={pr.state === 'open' ? 'default' : 'secondary'} 
                                   className={pr.merged 
                                     ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                                     : pr.state === 'open' 
                                     ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                                     : 'bg-red-500/20 text-red-400 border-red-500/30'}>
                              {pr.merged ? <GitMerge className="w-3 h-3 mr-1" /> : pr.state === 'open' ? <GitPullRequest className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                              {pr.merged ? 'merged' : pr.state}
                            </Badge>
                            <span className="text-gray-400 text-sm">#{pr.number}</span>
                            {pr.draft && (
                              <Badge variant="outline" className="border-gray-500/30 text-gray-400 text-xs">
                                Draft
                              </Badge>
                            )}
                          </div>
                          <h4 className="text-lg font-medium text-white mb-2 hover:text-purple-400 transition-colors">
                            <a href={pr.html_url} target="_blank" rel="noopener noreferrer">
                              {pr.title}
                            </a>
                          </h4>
                          {pr.body && (
                            <p className="text-gray-400 text-sm line-clamp-2 mb-3">{pr.body}</p>
                          )}
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <span>by {pr.user.login}</span>
                            <span className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {formatDate(pr.created_at)}
                            </span>
                            <span className="flex items-center">
                              <GitBranch className="w-3 h-3 mr-1" />
                              {pr.head.ref} → {pr.base.ref}
                            </span>
                            {pr.comments > 0 && (
                              <span className="flex items-center">
                                <MessageCircle className="w-3 h-3 mr-1" />
                                {pr.comments} comments
                              </span>
                            )}
                          </div>
                        </div>
                        <Image
                          src={pr.user.avatar_url}
                          alt={pr.user.login}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full border-2 border-purple-500/30"
                        />
                      </div>
                      {pr.labels.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {pr.labels.map((label, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs"
                              style={{ 
                                borderColor: `#${label.color}`,
                                color: `#${label.color}`,
                                backgroundColor: `#${label.color}20`
                              }}
                            >
                              {label.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <GitPullRequest className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No pull requests found</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'commits' && (
              <div className="space-y-4">
                {commits.length > 0 ? (
                  commits.map((commit) => (
                    <div key={commit.sha} className="glass-card p-6 rounded-xl">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-lg font-medium text-white mb-2 hover:text-purple-400 transition-colors">
                            <a href={commit.html_url} target="_blank" rel="noopener noreferrer">
                              {commit.commit.message.split('\n')[0]}
                            </a>
                          </h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <span>by {commit.commit.author.name}</span>
                            <span className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {formatDateTime(commit.commit.author.date)}
                            </span>
                            <Badge variant="outline" className="font-mono text-xs border-gray-500/30 text-gray-400">
                              <GitCommit className="w-3 h-3 mr-1" />
                              {commit.sha.substring(0, 7)}
                            </Badge>
                          </div>
                        </div>
                        <Image
                          src={commit.author?.avatar_url || '/default-avatar.png'}
                          alt={commit.author?.login || 'Unknown'}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full border-2 border-purple-500/30"
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <GitCommit className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No commits found</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'collaborators' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {collaborators.length > 0 ? (
                  collaborators.map((collaborator) => (
                    <div key={collaborator.id} className="glass-card p-6 rounded-xl">
                      <div className="flex items-center space-x-4">
                        <Image
                          src={collaborator.avatar_url || '/default-avatar.png'}
                          alt={collaborator.login || 'Unknown'}
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-full border-2 border-purple-500/30"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-white hover:text-purple-400 transition-colors">
                            <a href={collaborator.html_url} target="_blank" rel="noopener noreferrer">
                              {collaborator.login}
                            </a>
                          </h4>
                          <p className="text-sm text-gray-400 capitalize">{collaborator.role_name}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-4">
                        {collaborator.permissions.admin && (
                          <Badge variant="destructive" className="text-xs">
                            <Shield className="w-3 h-3 mr-1" />
                            Admin
                          </Badge>
                        )}
                        {collaborator.permissions.push && (
                          <Badge variant="default" className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                            Write
                          </Badge>
                        )}
                        {collaborator.permissions.pull && (
                          <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                            Read
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12 text-gray-400">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No collaborators found</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'branches' && (
              <div className="space-y-4">
                {branches.length > 0 ? (
                  branches.map((branch) => (
                    <div key={branch.name} className="glass-card p-6 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <h4 className="font-medium text-white flex items-center">
                            <GitBranch className="w-4 h-4 mr-2 text-blue-400" />
                            {branch.name}
                          </h4>
                          {branch.name === repository.default_branch && (
                            <Badge variant="default" className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                              default
                            </Badge>
                          )}
                          {branch.protected && (
                            <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                              <Shield className="w-3 h-3 mr-1" />
                              protected
                            </Badge>
                          )}
                        </div>
                        <Badge variant="outline" className="font-mono text-xs border-gray-500/30 text-gray-400">
                          <GitCommit className="w-3 h-3 mr-1" />
                          {branch.commit.sha.substring(0, 7)}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <GitBranch className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No branches found</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'releases' && (
              <div className="space-y-4">
                {releases.length > 0 ? (
                  releases.map((release) => (
                    <div key={release.id} className="glass-card p-6 rounded-xl">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <h4 className="text-lg font-medium text-white hover:text-purple-400 transition-colors">
                              <a href={release.html_url} target="_blank" rel="noopener noreferrer">
                                {release.name || release.tag_name}
                              </a>
                            </h4>
                            <Badge variant="outline" className="font-mono text-xs border-blue-500/30 text-blue-400">
                              <Package className="w-3 h-3 mr-1" />
                              {release.tag_name}
                            </Badge>
                            {release.prerelease && (
                              <Badge variant="secondary" className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">
                                Pre-release
                              </Badge>
                            )}
                            {release.draft && (
                              <Badge variant="outline" className="border-gray-500/30 text-gray-400 text-xs">
                                Draft
                              </Badge>
                            )}
                          </div>
                          {release.body && (
                            <p className="text-gray-400 text-sm line-clamp-3 mb-3">{release.body}</p>
                          )}
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <span>by {release.author.login}</span>
                            <span className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {formatDate(release.created_at)}
                            </span>
                            {release.published_at && (
                              <span>published {formatDate(release.published_at)}</span>
                            )}
                          </div>
                        </div>
                        <Image
                          src={release.author.avatar_url}
                          alt={release.author.login}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full border-2 border-purple-500/30"
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No releases found</p>
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