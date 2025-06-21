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
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading repository...</p>
        </div>
      </div>
    );
  }

  if (error || !repository) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
            <p className="text-red-700 mb-4">{error || 'Repository not found'}</p>
            <Link 
              href="/github"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              ← Back to Repositories
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'issues', label: `Issues (${repository.open_issues_count})` },
    { id: 'pulls', label: 'Pull Requests' },
    { id: 'commits', label: 'Commits' },
    { id: 'collaborators', label: 'Collaborators' },
    { id: 'branches', label: 'Branches' },
    { id: 'releases', label: 'Releases' },
  ] as const;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
          <Link href="/github" className="hover:text-blue-600">Repositories</Link>
          <span>/</span>
          <Link href={`/github/${owner}`} className="hover:text-blue-600">{owner}</Link>
          <span>/</span>
          <span className="font-medium">{repo}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {repository.name}
              </h1>
              {repository.description && (
                <p className="text-gray-600 mt-1">{repository.description}</p>
              )}
            </div>
            {repository.private && (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
                Private
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <a
              href={repository.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              View on GitHub
            </a>
            <Link
              href="/github"
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ← Back to Repositories
            </Link>
          </div>
        </div>

        {/* Repository Stats */}
        <div className="flex items-center space-x-6 mt-4 text-sm text-gray-600">
          {repository.language && (
            <div className="flex items-center space-x-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getLanguageColor(repository.language) }}
              ></div>
              <span>{repository.language}</span>
            </div>
          )}
          
          <div className="flex items-center space-x-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span>{repository.stargazers_count} stars</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414L2.586 8l3.707-3.707a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>{repository.forks_count} forks</span>
          </div>
          
          <span>Updated {formatDate(repository.updated_at)}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Repository Information</h3>
                <dl className="grid grid-cols-1 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                    <dd className="text-sm text-gray-900">{repository.full_name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Clone URL</dt>
                    <dd className="text-sm text-gray-900 font-mono break-all">{repository.clone_url}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">SSH URL</dt>
                    <dd className="text-sm text-gray-900 font-mono break-all">{repository.ssh_url}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Default Branch</dt>
                    <dd className="text-sm text-gray-900">{repository.default_branch}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Created</dt>
                    <dd className="text-sm text-gray-900">{formatDate(repository.created_at)}</dd>
                  </div>
                  {repository.pushed_at && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Last Push</dt>
                      <dd className="text-sm text-gray-900">{formatDate(repository.pushed_at)}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
            
            <div>
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Stars</span>
                    <span className="font-medium">{repository.stargazers_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Watchers</span>
                    <span className="font-medium">{repository.watchers_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Forks</span>
                    <span className="font-medium">{repository.forks_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Open Issues</span>
                    <span className="font-medium">{repository.open_issues_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Visibility</span>
                    <span className="font-medium">{repository.private ? 'Private' : 'Public'}</span>
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
                <div key={issue.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          issue.state === 'open' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {issue.state}
                        </span>
                        <span className="text-gray-500 text-sm">#{issue.number}</span>
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">
                        <a href={issue.html_url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
                          {issue.title}
                        </a>
                      </h4>
                      {issue.body && (
                        <p className="text-gray-600 text-sm line-clamp-2">{issue.body}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>by {issue.user.login}</span>
                        <span>{formatDate(issue.created_at)}</span>
                        {issue.comments > 0 && (
                          <span>{issue.comments} comments</span>
                        )}
                      </div>
                    </div>
                    <Image
                      src={issue.user.avatar_url}
                      alt={issue.user.login}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full"
                    />
                  </div>
                  {issue.labels.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {issue.labels.map((label, index) => (
                        <span
                          key={index}
                          className="inline-block px-2 py-1 text-xs rounded-full text-white"
                          style={{ backgroundColor: `#${label.color}` }}
                        >
                          {label.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No issues found
              </div>
            )}
          </div>
        )}

        {activeTab === 'pulls' && (
          <div className="space-y-4">
            {pullRequests.length > 0 ? (
              pullRequests.map((pr) => (
                <div key={pr.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          pr.state === 'open' 
                            ? 'bg-green-100 text-green-800' 
                            : pr.merged 
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {pr.merged ? 'merged' : pr.state}
                        </span>
                        <span className="text-gray-500 text-sm">#{pr.number}</span>
                        {pr.draft && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                            Draft
                          </span>
                        )}
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">
                        <a href={pr.html_url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
                          {pr.title}
                        </a>
                      </h4>
                      {pr.body && (
                        <p className="text-gray-600 text-sm line-clamp-2">{pr.body}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>by {pr.user.login}</span>
                        <span>{formatDate(pr.created_at)}</span>
                        <span>{pr.head.ref} → {pr.base.ref}</span>
                        {pr.comments > 0 && (
                          <span>{pr.comments} comments</span>
                        )}
                      </div>
                    </div>
                    <Image
                      src={pr.user.avatar_url}
                      alt={pr.user.login}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full"
                    />
                  </div>
                  {pr.labels.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {pr.labels.map((label, index) => (
                        <span
                          key={index}
                          className="inline-block px-2 py-1 text-xs rounded-full text-white"
                          style={{ backgroundColor: `#${label.color}` }}
                        >
                          {label.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No pull requests found
              </div>
            )}
          </div>
        )}

        {activeTab === 'commits' && (
          <div className="space-y-4">
            {commits.length > 0 ? (
              commits.map((commit) => (
                <div key={commit.sha} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-lg font-medium text-gray-900 mb-2">
                        <a href={commit.html_url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
                          {commit.commit.message.split('\n')[0]}
                        </a>
                      </h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>by {commit.commit.author.name}</span>
                        <span>{formatDateTime(commit.commit.author.date)}</span>
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                          {commit.sha.substring(0, 7)}
                        </span>
                      </div>
                    </div>
                    <Image
                      src={commit.author?.avatar_url || '/default-avatar.png'}
                      alt={commit.author?.login || 'Unknown'}
                      width={40}
                      height={40}
                      className="w-8 h-8 rounded-full"
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No commits found
              </div>
            )}
          </div>
        )}

        {activeTab === 'collaborators' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {collaborators.length > 0 ? (
              collaborators.map((collaborator) => (
                <div key={collaborator.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <Image
                      src={collaborator.avatar_url || '/default-avatar.png'}
                      alt={collaborator.login || 'Unknown'}
                      width={40}
                      height={40}
                      className="w-12 h-12 rounded-full"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        <a href={collaborator.html_url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
                          {collaborator.login}
                        </a>
                      </h4>
                      <p className="text-sm text-gray-500 capitalize">{collaborator.role_name}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {collaborator.permissions.admin && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Admin</span>
                        )}
                        {collaborator.permissions.push && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Write</span>
                        )}
                        {collaborator.permissions.pull && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Read</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-gray-500">
                No collaborators found
              </div>
            )}
          </div>
        )}

        {activeTab === 'branches' && (
          <div className="space-y-4">
            {branches.length > 0 ? (
              branches.map((branch) => (
                <div key={branch.name} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-medium text-gray-900">{branch.name}</h4>
                      {branch.name === repository.default_branch && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">default</span>
                      )}
                      {branch.protected && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">protected</span>
                      )}
                    </div>
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                      {branch.commit.sha.substring(0, 7)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No branches found
              </div>
            )}
          </div>
        )}

        {activeTab === 'releases' && (
          <div className="space-y-4">
            {releases.length > 0 ? (
              releases.map((release) => (
                <div key={release.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="text-lg font-medium text-gray-900">
                          <a href={release.html_url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
                            {release.name || release.tag_name}
                          </a>
                        </h4>
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                          {release.tag_name}
                        </span>
                        {release.prerelease && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                            Pre-release
                          </span>
                        )}
                        {release.draft && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                            Draft
                          </span>
                        )}
                      </div>
                      {release.body && (
                        <p className="text-gray-600 text-sm line-clamp-3">{release.body}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>by {release.author.login}</span>
                        <span>{formatDate(release.created_at)}</span>
                        {release.published_at && (
                          <span>published {formatDate(release.published_at)}</span>
                        )}
                      </div>
                    </div>
                    <Image
                      src={release.author.avatar_url}
                      alt={release.author.login}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full"
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No releases found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 