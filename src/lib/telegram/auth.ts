import crypto from 'crypto';
import TelegramBot from 'node-telegram-bot-api';

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

export interface TelegramAuthConfig {
  bot_token: string;
  bot_username: string;
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
  permissions?: {
    can_send_messages?: boolean;
    can_send_media_messages?: boolean;
    can_send_polls?: boolean;
    can_send_other_messages?: boolean;
    can_add_web_page_previews?: boolean;
    can_change_info?: boolean;
    can_invite_users?: boolean;
    can_pin_messages?: boolean;
  };
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
  edit_date?: number;
  media_group_id?: string;
}

export interface TelegramLoginWidget {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export interface AuthSession {
  sessionId: string;
  status: 'pending' | 'authenticated' | 'expired';
  created_at: number;
  authenticated_at?: number;
  user?: TelegramUser;
  qr_code?: string;
  phone_number?: string;
  auth_code?: string;
}

export class TelegramAuth {
  private config: TelegramAuthConfig;
  private authSessions: Map<string, AuthSession> = new Map();
  private bot?: TelegramBot;

  constructor(config: TelegramAuthConfig) {
    this.config = config;
    this.initializeBot();
  }

  /**
   * Initialize Telegram Bot if token is provided
   */
  private initializeBot(): void {
    if (this.config.bot_token) {
      try {
        // Don't enable polling in production - use webhooks instead
        this.bot = new TelegramBot(this.config.bot_token, { 
          polling: process.env.NODE_ENV === 'development',
          webHook: false 
        });

        if (process.env.NODE_ENV === 'development') {
          this.setupBotHandlers();
        }
      } catch (error) {
        console.error('Failed to initialize Telegram bot:', error);
      }
    }
  }

  /**
   * Setup bot event handlers for development
   */
  private setupBotHandlers(): void {
    if (!this.bot) return;

    this.bot.on('message', (msg) => {
      console.log('Telegram message received:', {
        from: msg.from?.username,
        chat: msg.chat.id,
        text: msg.text
      });
    });

    this.bot.on('callback_query', (callbackQuery) => {
      console.log('Telegram callback received:', {
        from: callbackQuery.from?.username,
        data: callbackQuery.data
      });
    });
  }

  /**
   * Set webhook for production use
   */
  async setWebhook(webhookUrl: string): Promise<boolean> {
    if (!this.bot) {
      throw new Error('Bot not initialized');
    }

    try {
      await this.bot.setWebHook(webhookUrl);
      console.log('Telegram webhook set successfully');
      return true;
    } catch (error) {
      console.error('Failed to set Telegram webhook:', error);
      return false;
    }
  }

  /**
   * Process webhook update
   */
  async processWebhookUpdate(update: TelegramBot.Update): Promise<void> {
    if (!this.bot) return;

    try {
      this.bot.processUpdate(update);
    } catch (error) {
      console.error('Error processing webhook update:', error);
    }
  }

  /**
   * Verify Telegram Login Widget data using the correct algorithm
   * Reference: https://core.telegram.org/widgets/login#checking-authorization
   */
  verifyTelegramAuth(authData: TelegramLoginWidget): boolean {
    try {
      if (!this.config.bot_token) {
        console.error('Bot token not configured');
        return false;
      }

      const { hash, ...data } = authData;
      
      // Create data string for verification
      const dataCheckString = Object.keys(data)
        .sort()
        .map(key => `${key}=${data[key as keyof typeof data]}`)
        .join('\n');

      // Create secret key using SHA256 of bot token
      const secretKey = crypto.createHash('sha256').update(this.config.bot_token).digest();
      
      // Create HMAC hash
      const hmac = crypto.createHmac('sha256', secretKey);
      hmac.update(dataCheckString);
      const calculatedHash = hmac.digest('hex');

      // Verify hash matches
      if (calculatedHash !== hash) {
        console.error('Hash verification failed');
        return false;
      }

      // Check if auth_date is not too old (within 24 hours)
      const now = Math.floor(Date.now() / 1000);
      if (now - authData.auth_date > 86400) {
        console.error('Auth data too old');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error verifying Telegram auth:', error);
      return false;
    }
  }

  /**
   * Generate QR code for Telegram login (mockup for now)
   */
  async generateQRCode(sessionId: string): Promise<string> {
    try {
      // Create auth session
      const session: AuthSession = {
        sessionId,
        status: 'pending',
        created_at: Date.now(),
      };

      this.authSessions.set(sessionId, session);

      // Generate QR code data - this would normally be a deep link to your bot
      const qrData = `https://t.me/${this.config.bot_username}?start=${sessionId}`;
      
      // In a real implementation, you'd use a QR code library
      // For now, we'll return a placeholder
      const qrCodeSvg = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="white"/>
        <text x="100" y="100" text-anchor="middle" font-family="Arial" font-size="12">
          QR Code: ${qrData}
        </text>
      </svg>`;

      // Convert to data URL
      const qrCodeDataUrl = `data:image/svg+xml;base64,${Buffer.from(qrCodeSvg).toString('base64')}`;
      
      session.qr_code = qrCodeDataUrl;
      this.authSessions.set(sessionId, session);

      return qrCodeDataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Generate phone auth (development mode only)
   */
  async generatePhoneAuth(phoneNumber: string, sessionId: string): Promise<{ authCode: string; session: AuthSession }> {
    // Create auth session
    const session: AuthSession = {
      sessionId,
      status: 'pending',
      created_at: Date.now(),
      phone_number: phoneNumber,
    };

    // In development, generate a simple auth code
    const authCode = Math.floor(100000 + Math.random() * 900000).toString();
    session.auth_code = authCode;

    this.authSessions.set(sessionId, session);

    return { authCode, session };
  }

  /**
   * Verify phone auth code
   */
  verifyPhoneAuthCode(sessionId: string, code: string): boolean {
    const session = this.authSessions.get(sessionId);
    if (!session || session.status !== 'pending' || !session.auth_code) {
      return false;
    }

    // Check if auth code is correct and not expired (5 minutes)
    if (session.auth_code === code && Date.now() - session.created_at < 300000) {
      // Create mock user data for demo purposes
      const mockUser: TelegramUser = {
        id: Math.floor(Math.random() * 1000000),
        first_name: 'Demo User',
        phone_number: session.phone_number,
        auth_date: Math.floor(Date.now() / 1000),
        hash: crypto.createHash('sha256').update(sessionId + code).digest('hex')
      };

      session.status = 'authenticated';
      session.authenticated_at = Date.now();
      session.user = mockUser;
      this.authSessions.set(sessionId, session);

      return true;
    }

    return false;
  }

  /**
   * Parse Telegram user data from login widget
   */
  parseTelegramUser(authData: TelegramLoginWidget): TelegramUser {
    return {
      id: authData.id,
      first_name: authData.first_name,
      last_name: authData.last_name,
      username: authData.username,
      photo_url: authData.photo_url,
      auth_date: authData.auth_date,
      hash: authData.hash
    };
  }

  /**
   * Get session status
   */
  getSessionStatus(sessionId: string): AuthSession | null {
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
   * Generate unique session ID
   */
  generateSessionId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Get bot instance for advanced operations
   */
  getBot(): TelegramBot | undefined {
    return this.bot;
  }

  /**
   * Send message via bot
   */
  async sendMessage(chatId: number, text: string, options?: TelegramBot.SendMessageOptions): Promise<TelegramBot.Message> {
    if (!this.bot) {
      throw new Error('Bot not initialized');
    }

    try {
      return await this.bot.sendMessage(chatId, text, options);
    } catch (error) {
      console.error('Error sending Telegram message:', error);
      throw error;
    }
  }

  /**
   * Get chat information
   */
  async getChat(chatId: number): Promise<TelegramChat> {
    if (!this.bot) {
      throw new Error('Bot not initialized');
    }

    try {
      const chat = await this.bot.getChat(chatId);
      return chat as TelegramChat;
    } catch (error) {
      console.error('Error getting Telegram chat:', error);
      throw error;
    }
  }

  /**
   * Create login widget script URL
   */
  createLoginWidgetScript(): string {
    return 'https://telegram.org/js/telegram-widget.js?22';
  }

  /**
   * Create login widget iframe URL
   */
  createLoginWidgetIframe(origin: string): string {
    const params = new URLSearchParams({
      bot_id: this.config.bot_username,
      origin: origin,
      embed: '1',
      userpic: 'false',
      request_access: 'write'
    });

    return `https://oauth.telegram.org/embed/${this.config.bot_username}?${params.toString()}`;
  }

  /**
   * Get bot configuration
   */
  getBotConfig(): { botUsername: string; hasToken: boolean } {
    return {
      botUsername: this.config.bot_username,
      hasToken: !!this.config.bot_token
    };
  }
}

// Initialize with environment variables - handle the case where bot_token might be placeholder
const botToken = process.env.TELEGRAM_BOT_TOKEN;
const isValidToken = botToken && botToken !== 'your_bot_token_here' && botToken.length > 10;

const config: TelegramAuthConfig = {
  bot_token: isValidToken ? botToken! : '',
  bot_username: process.env.TELEGRAM_BOT_USERNAME || 'your_bot_username_here'
};

export const telegramAuth = new TelegramAuth(config); 