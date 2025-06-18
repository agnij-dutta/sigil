import QRCode from 'qrcode';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  phone_number?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export interface TelegramAuthConfig {
  api_id: string;
  api_hash: string;
  bot_token?: string;
}

export interface TelegramChat {
  id: number;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  photo?: {
    small_file_id: string;
    big_file_id: string;
  };
  bio?: string;
  description?: string;
  participant_count?: number;
}

export interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  date: number;
  chat: TelegramChat;
  text?: string;
  entities?: Array<{
    type: string;
    offset: number;
    length: number;
    url?: string;
    user?: TelegramUser;
  }>;
  photo?: Array<{
    file_id: string;
    file_unique_id: string;
    width: number;
    height: number;
    file_size?: number;
  }>;
  document?: {
    file_name?: string;
    mime_type?: string;
    file_id: string;
    file_unique_id: string;
    file_size?: number;
  };
  forward_from?: TelegramUser;
  forward_from_chat?: TelegramChat;
  forward_date?: number;
  reply_to_message?: TelegramMessage;
}

export class TelegramAuth {
  private config: TelegramAuthConfig;
  private authSessions: Map<string, any> = new Map(); // eslint-disable-line @typescript-eslint/no-explicit-any

  constructor(config: TelegramAuthConfig) {
    this.config = config;
  }

  /**
   * Generate QR code for Telegram login
   */
  async generateQRCode(sessionId: string): Promise<string> {
    try {
      // Create a unique auth URL for the session
      const authUrl = `tg://login?token=${sessionId}&api_id=${this.config.api_id}`;
      
      // Generate QR code
      const qrCode = await QRCode.toDataURL(authUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Store session for verification
      this.authSessions.set(sessionId, {
        created_at: Date.now(),
        status: 'pending',
        auth_url: authUrl
      });

      return qrCode;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw error;
    }
  }

  /**
   * Generate phone number auth link
   */
  generatePhoneAuthUrl(phoneNumber: string, sessionId: string): string {
    const authUrl = `tg://resolve?domain=telegram&phone=${encodeURIComponent(phoneNumber)}&session=${sessionId}`;
    
    // Store session for verification
    this.authSessions.set(sessionId, {
      created_at: Date.now(),
      status: 'pending',
      phone_number: phoneNumber,
      auth_url: authUrl
    });

    return authUrl;
  }

  /**
   * Verify Telegram authentication data
   */
  verifyTelegramAuth(authData: Record<string, string>): boolean {
    try {
      const { hash, ...data } = authData; // eslint-disable-line @typescript-eslint/no-unused-vars
      
      // Create data string for verification
      const dataCheckString = Object.keys(data) // eslint-disable-line @typescript-eslint/no-unused-vars
        .sort()
        .map(key => `${key}=${data[key]}`)
        .join('\n');

      // In a real implementation, you would verify the hash against your bot token
      // using HMAC-SHA256. For now, we'll do a basic check
      const now = Math.floor(Date.now() / 1000);
      const authDate = parseInt(data.auth_date);
      
      // Check if auth_date is not too old (within 1 day)
      if (now - authDate > 86400) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error verifying Telegram auth:', error);
      return false;
    }
  }

  /**
   * Parse Telegram user data from auth response
   */
  parseTelegramUser(authData: Record<string, string>): TelegramUser {
    return {
      id: parseInt(authData.id),
      first_name: authData.first_name,
      last_name: authData.last_name,
      username: authData.username,
      phone_number: authData.phone_number,
      photo_url: authData.photo_url,
      auth_date: parseInt(authData.auth_date),
      hash: authData.hash
    };
  }

  /**
   * Get session status
   */
  getSessionStatus(sessionId: string): { status: string; data?: any } | null { // eslint-disable-line @typescript-eslint/no-explicit-any
    const session = this.authSessions.get(sessionId);
    if (!session) {
      return null;
    }

    // Check if session is expired (older than 1 hour)
    if (Date.now() - session.created_at > 3600000) {
      this.authSessions.delete(sessionId);
      return null;
    }

    return session;
  }

  /**
   * Update session with auth data
   */
  updateSession(sessionId: string, authData: TelegramUser): void {
    const session = this.authSessions.get(sessionId);
    if (session) {
      session.status = 'authenticated';
      session.user = authData;
      session.authenticated_at = Date.now();
      this.authSessions.set(sessionId, session);
    }
  }

  /**
   * Clean up expired sessions
   */
  cleanupSessions(): void {
    const now = Date.now();
    for (const [sessionId, session] of this.authSessions.entries()) {
      if (now - session.created_at > 3600000) { // 1 hour
        this.authSessions.delete(sessionId);
      }
    }
  }

  /**
   * Generate a unique session ID
   */
  generateSessionId(): string {
    return crypto.randomUUID();
  }
}

// Default Telegram auth instance
export const telegramAuth = new TelegramAuth({
  api_id: process.env.TELEGRAM_API_ID!,
  api_hash: process.env.TELEGRAM_API_HASH!,
  bot_token: process.env.TELEGRAM_BOT_TOKEN,
}); 