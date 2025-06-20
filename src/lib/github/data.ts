import { Octokit } from 'octokit';
import { githubAuth } from './auth';

export interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  html_url: string;
  clone_url: string;
  ssh_url: string;
  language: string | null;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
  created_at: string;
  updated_at: string;
  pushed_at: string | null;
  owner: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
  permissions: {
    admin: boolean;
    maintain: boolean;
    push: boolean;
    triage: boolean;
    pull: boolean;
  };
}

export interface Issue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  html_url: string;
  user: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
  assignees: Array<{
    login: string;
    avatar_url: string;
    html_url: string;
  }>;
  labels: Array<{
    name: string;
    color: string;
    description: string | null;
  }>;
  milestone: {
    title: string;
    description: string | null;
    state: 'open' | 'closed';
    due_on: string | null;
  } | null;
  comments: number;
  pull_request?: {
    url: string;
    html_url: string;
    diff_url: string;
    patch_url: string;
  };
}

export interface PullRequest {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
  html_url: string;
  diff_url: string;
  patch_url: string;
  mergeable: boolean | null;
  merged: boolean;
  draft: boolean;
  user: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
  assignees: Array<{
    login: string;
    avatar_url: string;
    html_url: string;
  }>;
  labels: Array<{
    name: string;
    color: string;
    description: string | null;
  }>;
  head: {
    ref: string;
    sha: string;
    repo: {
      name: string;
      full_name: string;
      html_url: string;
    } | null;
  };
  base: {
    ref: string;
    sha: string;
    repo: {
      name: string;
      full_name: string;
      html_url: string;
    };
  };
  additions: number;
  deletions: number;
  changed_files: number;
  commits: number;
  comments: number;
  review_comments: number;
}

export interface Commit {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
    committer: {
      name: string;
      email: string;
      date: string;
    };
  };
  author: {
    login: string;
    avatar_url: string;
    html_url: string;
  } | null;
  committer: {
    login: string;
    avatar_url: string;
    html_url: string;
  } | null;
  stats: {
    additions: number;
    deletions: number;
    total: number;
  };
}

export interface Collaborator {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  type: string;
  site_admin: boolean;
  permissions: {
    admin: boolean;
    maintain: boolean;
    push: boolean;
    triage: boolean;
    pull: boolean;
  };
  role_name: string;
}

export interface Branch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}

export interface Release {
  id: number;
  tag_name: string;
  target_commitish: string;
  name: string | null;
  body: string | null;
  draft: boolean;
  prerelease: boolean;
  created_at: string;
  published_at: string | null;
  html_url: string;
  tarball_url: string;
  zipball_url: string;
  author: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
}

export class GitHubDataService {
  private octokit: Octokit;

  constructor(accessToken: string) {
    this.octokit = githubAuth.createOctokitInstance(accessToken);
  }

  /**
   * Get all repositories for the authenticated user
   */
  async getRepositories(params?: {
    type?: 'all' | 'owner' | 'public' | 'private' | 'member';
    sort?: 'created' | 'updated' | 'pushed' | 'full_name';
    direction?: 'asc' | 'desc';
    per_page?: number;
    page?: number;
  }): Promise<Repository[]> {
    try {
      const { data } = await this.octokit.rest.repos.listForAuthenticatedUser({
        type: params?.type || 'all',
        sort: params?.sort || 'updated',
        direction: params?.direction || 'desc',
        per_page: params?.per_page || 30,
        page: params?.page || 1,
      });

      return data as Repository[];
    } catch (error) {
      console.error('Error fetching repositories:', error);
      throw error;
    }
  }

  /**
   * Get repository details
   */
  async getRepository(owner: string, repo: string): Promise<Repository> {
    try {
      const { data } = await this.octokit.rest.repos.get({
        owner,
        repo,
      });

      return data as Repository;
    } catch (error) {
      console.error('Error fetching repository:', error);
      throw error;
    }
  }

  /**
   * Get issues for a repository
   */
  async getIssues(owner: string, repo: string, params?: {
    state?: 'open' | 'closed' | 'all';
    labels?: string;
    sort?: 'created' | 'updated' | 'comments';
    direction?: 'asc' | 'desc';
    since?: string;
    per_page?: number;
    page?: number;
  }): Promise<Issue[]> {
    try {
      const { data } = await this.octokit.rest.issues.listForRepo({
        owner,
        repo,
        state: params?.state || 'all',
        labels: params?.labels,
        sort: params?.sort || 'updated',
        direction: params?.direction || 'desc',
        since: params?.since,
        per_page: params?.per_page || 30,
        page: params?.page || 1,
      });

      // Filter out pull requests (they show up in issues endpoint)
      return data.filter(issue => !issue.pull_request) as Issue[];
    } catch (error) {
      console.error('Error fetching issues:', error);
      throw error;
    }
  }

  /**
   * Get pull requests for a repository
   */
  async getPullRequests(owner: string, repo: string, params?: {
    state?: 'open' | 'closed' | 'all';
    head?: string;
    base?: string;
    sort?: 'created' | 'updated' | 'popularity' | 'long-running';
    direction?: 'asc' | 'desc';
    per_page?: number;
    page?: number;
  }): Promise<PullRequest[]> {
    try {
      const { data } = await this.octokit.rest.pulls.list({
        owner,
        repo,
        state: params?.state || 'all',
        head: params?.head,
        base: params?.base,
        sort: params?.sort || 'updated',
        direction: params?.direction || 'desc',
        per_page: params?.per_page || 30,
        page: params?.page || 1,
      });

      return data as unknown as PullRequest[];
    } catch (error) {
      console.error('Error fetching pull requests:', error);
      throw error;
    }
  }

  /**
   * Get commits for a repository
   */
  async getCommits(owner: string, repo: string, params?: {
    sha?: string;
    path?: string;
    author?: string;
    since?: string;
    until?: string;
    per_page?: number;
    page?: number;
  }): Promise<Commit[]> {
    try {
      const { data } = await this.octokit.rest.repos.listCommits({
        owner,
        repo,
        sha: params?.sha,
        path: params?.path,
        author: params?.author,
        since: params?.since,
        until: params?.until,
        per_page: params?.per_page || 30,
        page: params?.page || 1,
      });

      return data as Commit[];
    } catch (error) {
      console.error('Error fetching commits:', error);
      throw error;
    }
  }

  /**
   * Get collaborators for a repository
   */
  async getCollaborators(owner: string, repo: string, params?: {
    affiliation?: 'outside' | 'direct' | 'all';
    permission?: 'pull' | 'triage' | 'push' | 'maintain' | 'admin';
    per_page?: number;
    page?: number;
  }): Promise<Collaborator[]> {
    try {
      const { data } = await this.octokit.rest.repos.listCollaborators({
        owner,
        repo,
        affiliation: params?.affiliation || 'all',
        permission: params?.permission,
        per_page: params?.per_page || 30,
        page: params?.page || 1,
      });

      return data as Collaborator[];
    } catch (error) {
      console.error('Error fetching collaborators:', error);
      throw error;
    }
  }

  /**
   * Get branches for a repository
   */
  async getBranches(owner: string, repo: string, params?: {
    protected?: boolean;
    per_page?: number;
    page?: number;
  }): Promise<Branch[]> {
    try {
      const { data } = await this.octokit.rest.repos.listBranches({
        owner,
        repo,
        protected: params?.protected,
        per_page: params?.per_page || 30,
        page: params?.page || 1,
      });

      return data as Branch[];
    } catch (error) {
      console.error('Error fetching branches:', error);
      throw error;
    }
  }

  /**
   * Get releases for a repository
   */
  async getReleases(owner: string, repo: string, params?: {
    per_page?: number;
    page?: number;
  }): Promise<Release[]> {
    try {
      const { data } = await this.octokit.rest.repos.listReleases({
        owner,
        repo,
        per_page: params?.per_page || 30,
        page: params?.page || 1,
      });

      return data as Release[];
    } catch (error) {
      console.error('Error fetching releases:', error);
      throw error;
    }
  }

  /**
   * Get repository statistics
   */
  async getRepositoryStats(owner: string, repo: string) {
    try {
      const [
        repoData,
        languages,
        contributors,
        codeFrequency,
        commitActivity,
      ] = await Promise.all([
        this.getRepository(owner, repo),
        this.octokit.rest.repos.listLanguages({ owner, repo }),
        this.octokit.rest.repos.listContributors({ owner, repo, per_page: 10 }),
        this.octokit.rest.repos.getCodeFrequencyStats({ owner, repo }),
        this.octokit.rest.repos.getCommitActivityStats({ owner, repo }),
      ]);

      return {
        repository: repoData,
        languages: languages.data,
        topContributors: contributors.data.slice(0, 10),
        codeFrequency: codeFrequency.data,
        commitActivity: commitActivity.data,
      };
    } catch (error) {
      console.error('Error fetching repository stats:', error);
      throw error;
    }
  }

  /**
   * Get repositories where the user is a collaborator (including private repos)
   */
  async getCollaborativeRepositories(params?: {
    affiliation?: 'owner' | 'collaborator' | 'organization_member';
    sort?: 'created' | 'updated' | 'pushed' | 'full_name';
    direction?: 'asc' | 'desc';
    per_page?: number;
    page?: number;
  }): Promise<Repository[]> {
    try {
      // Get all repos including those where user is a collaborator
      const { data } = await this.octokit.rest.repos.listForAuthenticatedUser({
        affiliation: params?.affiliation || 'owner,collaborator,organization_member',
        sort: params?.sort || 'updated',
        direction: params?.direction || 'desc',
        per_page: params?.per_page || 100,
        page: params?.page || 1,
      });

      // Filter to only include private repos where user has push access or is a collaborator
      const collaborativeRepos = data.filter(repo => 
        repo.private && (
          repo.permissions?.push === true || 
          repo.permissions?.admin === true ||
          repo.permissions?.maintain === true
        )
      );

      return collaborativeRepos as Repository[];
    } catch (error) {
      console.error('Error fetching collaborative repositories:', error);
      throw error;
    }
  }

  /**
   * Get user's commits from a specific private repository (where they are a collaborator)
   */
  async getUserCommitsFromRepo(owner: string, repo: string, username: string, params?: {
    sha?: string;
    path?: string;
    since?: string;
    until?: string;
    per_page?: number;
    page?: number;
  }): Promise<Commit[]> {
    try {
      // First verify the user has access to this repository
      const repository = await this.getRepository(owner, repo);
      if (!repository.permissions?.pull) {
        throw new Error('Access denied: User does not have access to this repository');
      }

      // Get commits and filter by the authenticated user
      const { data } = await this.octokit.rest.repos.listCommits({
        owner,
        repo,
        author: username, // Filter commits by the specific user
        sha: params?.sha,
        path: params?.path,
        since: params?.since,
        until: params?.until,
        per_page: params?.per_page || 30,
        page: params?.page || 1,
      });

      return data as Commit[];
    } catch (error) {
      console.error('Error fetching user commits:', error);
      throw error;
    }
  }

  /**
   * Get detailed commit information including file changes and stats
   */
  async getCommitDetails(owner: string, repo: string, sha: string): Promise<{
    commit: Commit;
    files: Array<{
      filename: string;
      status: 'added' | 'removed' | 'modified' | 'renamed' | 'copied' | 'changed' | 'unchanged';
      additions: number;
      deletions: number;
      changes: number;
      patch?: string;
    }>;
    stats: {
      additions: number;
      deletions: number;
      total: number;
    };
  }> {
    try {
      const { data } = await this.octokit.rest.repos.getCommit({
        owner,
        repo,
        ref: sha,
      });

      const files = data.files?.map(file => ({
        filename: file.filename,
        status: file.status as 'added' | 'removed' | 'modified' | 'renamed' | 'copied' | 'changed' | 'unchanged',
        additions: file.additions,
        deletions: file.deletions,
        changes: file.changes,
        patch: file.patch,
      })) || [];

      return {
        commit: data as Commit,
        files,
        stats: {
          additions: data.stats?.additions || 0,
          deletions: data.stats?.deletions || 0,
          total: data.stats?.total || 0,
        },
      };
    } catch (error) {
      console.error('Error fetching commit details:', error);
      throw error;
    }
  }

  /**
   * Check if user is a collaborator on a repository
   */
  async isCollaborator(owner: string, repo: string, username: string): Promise<boolean> {
    try {
      await this.octokit.rest.repos.checkCollaborator({
        owner,
        repo,
        username,
      });
      return true;
    } catch (error: any) {
      if (error?.status === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get repository permission level for the authenticated user
   */
  async getRepositoryPermission(owner: string, repo: string): Promise<{
    permission: 'admin' | 'write' | 'read' | 'none';
    user: {
      login: string;
      avatar_url: string;
      html_url: string;
    };
  } | null> {
    try {
      const user = await this.octokit.rest.users.getAuthenticated();
      const { data } = await this.octokit.rest.repos.getCollaboratorPermissionLevel({
        owner,
        repo,
        username: user.data.login,
      });

      return data as {
        permission: 'admin' | 'write' | 'read' | 'none';
        user: {
          login: string;
          avatar_url: string;
          html_url: string;
        };
      };
    } catch (error) {
      console.error('Error fetching repository permission:', error);
      return null;
    }
  }
}