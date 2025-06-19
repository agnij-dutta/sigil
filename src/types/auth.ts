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

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  phone_number?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
  is_bot?: boolean;
  language_code?: string;
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
  telegram?: {
    user: TelegramUser;
    authenticatedAt: string;
    sessionId: string;
  };
  civic?: {
    user: CivicUser;
    authenticatedAt: string;
  };
  exp?: number;
  iat?: number;
} 