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

export interface CivicUser {
  publicKey: string;
  walletAddress: string;
  verified: boolean;
  timestamp: number;
}

export interface AuthToken {
  github?: {
    user: GitHubUser;
    accessToken: string;
    authenticatedAt: string;
  };
  civic?: {
    user: CivicUser;
    authenticatedAt: string;
  };
  exp?: number;
  iat?: number;
} 