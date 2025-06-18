import { Octokit } from 'octokit';

export interface GitHubUser {
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

export interface GitHubAuthState {
  state: string;
  timestamp: number;
}

class GitHubAuth {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.GITHUB_CLIENT_ID || '';
    this.clientSecret = process.env.GITHUB_CLIENT_SECRET || '';
    this.redirectUri = process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/api/auth/github/callback';
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'user:email,public_repo,read:org',
      state: state,
      allow_signup: 'true'
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string, state: string): Promise<string> {
    try {
      const response = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code: code,
          state: state,
        }),
      });

      if (!response.ok) {
        throw new Error(`GitHub OAuth error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`GitHub OAuth error: ${data.error_description || data.error}`);
      }

      return data.access_token;
    } catch (error) {
      console.error('GitHub token exchange error:', error);
      throw error;
    }
  }

  /**
   * Get authenticated user information
   */
  async getAuthenticatedUser(accessToken: string): Promise<GitHubUser> {
    try {
      const octokit = new Octokit({
        auth: accessToken,
      });

      const { data } = await octokit.rest.users.getAuthenticated();
      
      return {
        id: data.id,
        login: data.login,
        name: data.name,
        email: data.email,
        avatar_url: data.avatar_url,
        html_url: data.html_url,
        public_repos: data.public_repos,
        followers: data.followers,
        following: data.following,
        created_at: data.created_at,
      };
    } catch (error) {
      console.error('GitHub user fetch error:', error);
      throw error;
    }
  }

  /**
   * Create Octokit instance with token
   */
  createOctokitInstance(accessToken: string): Octokit {
    return new Octokit({
      auth: accessToken,
    });
  }

  /**
   * Validate GitHub access token
   */
  async validateToken(accessToken: string): Promise<boolean> {
    try {
      const octokit = this.createOctokitInstance(accessToken);
      await octokit.rest.users.getAuthenticated();
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const githubAuth = new GitHubAuth(); 