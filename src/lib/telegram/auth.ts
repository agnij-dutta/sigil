import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { Api } from 'telegram/tl';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  phone_number?: string;
  is_bot?: boolean;
  language_code?: string;
  access_hash?: string;
}

export interface TelegramAuthConfig {
  api_id: number;
  api_hash: string;
}

export interface AuthSession {
  sessionId: string;
  status: 'pending' | 'phone_required' | 'code_required' | 'password_required' | 'authenticated' | 'expired';
  created_at: number;
  authenticated_at?: number;
  user?: TelegramUser;
  phone_number?: string;
  phone_code_hash?: string;
  session_string?: string;
}

class TelegramUserAuth {
  private config: TelegramAuthConfig;
  private sessions: Map<string, AuthSession> = new Map();
  private clients: Map<string, TelegramClient> = new Map();

  constructor() {
    const api_id = process.env.TELEGRAM_API_ID;
    const api_hash = process.env.TELEGRAM_API_HASH;

    if (!api_id || !api_hash) {
      throw new Error('TELEGRAM_API_ID and TELEGRAM_API_HASH must be set in environment variables');
    }

    this.config = {
      api_id: parseInt(api_id),
      api_hash
    };
  }

  // Start authentication flow - returns session ID
  async startAuth(): Promise<{ sessionId: string }> {
    const sessionId = this.generateSessionId();
    const session: AuthSession = {
      sessionId,
      status: 'phone_required',
      created_at: Date.now()
    };

    this.sessions.set(sessionId, session);
    
    // Clean up old sessions
    this.cleanupExpiredSessions();

    return { sessionId };
  }

  // Step 1: Send phone number
  async sendPhoneNumber(sessionId: string, phoneNumber: string): Promise<{ 
    success: boolean; 
    phoneCodeHash?: string; 
    error?: string;
  }> {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== 'phone_required') {
      return { success: false, error: 'Invalid session or incorrect state' };
    }

    try {
      // Create a new client for this session with empty string session
      const stringSession = new StringSession('');
      const client = new TelegramClient(stringSession, this.config.api_id, this.config.api_hash, {
        connectionRetries: 5,
      });

      await client.connect();

      // Send authentication code
      const result = await client.invoke(
        new Api.auth.SendCode({
          phoneNumber: phoneNumber,
          apiId: this.config.api_id,
          apiHash: this.config.api_hash,
          settings: new Api.CodeSettings({})
        })
      );

      // Store client and update session
      this.clients.set(sessionId, client);
      session.status = 'code_required';
      session.phone_number = phoneNumber;
      
      // Handle different result types
      if ('phoneCodeHash' in result) {
        session.phone_code_hash = result.phoneCodeHash;
        return { 
          success: true, 
          phoneCodeHash: result.phoneCodeHash 
        };
      } else {
        return { 
          success: false, 
          error: 'Failed to get phone code hash' 
        };
      }
    } catch (error: any) {
      console.error('Error sending phone number:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to send verification code' 
      };
    }
  }

  // Step 2: Verify phone code
  async verifyCode(sessionId: string, code: string): Promise<{
    success: boolean;
    user?: TelegramUser;
    sessionString?: string;
    needsPassword?: boolean;
    error?: string;
  }> {
    const session = this.sessions.get(sessionId);
    const client = this.clients.get(sessionId);

    if (!session || !client || session.status !== 'code_required') {
      return { success: false, error: 'Invalid session or incorrect state' };
    }

    if (!session.phone_number || !session.phone_code_hash) {
      return { success: false, error: 'Phone number or code hash not found' };
    }

    try {
      const result = await client.invoke(
        new Api.auth.SignIn({
          phoneNumber: session.phone_number,
          phoneCodeHash: session.phone_code_hash,
          phoneCode: code
        })
      );

      if (result instanceof Api.auth.AuthorizationSignUpRequired) {
        // User needs to sign up
        return { 
          success: false, 
          error: 'Account not found. Please sign up first in the Telegram app.' 
        };
      }

      if (result instanceof Api.auth.Authorization) {
        // Successfully authenticated
        const user = result.user;
        
        console.log('User object received:', JSON.stringify(user, null, 2));
        
        // Type guard to ensure we have a User object
        if (user && typeof user === 'object' && 'id' in user) {
          const telegramUser: TelegramUser = {
            id: Number(user.id),
            first_name: (user as any).firstName || (user as any).first_name || '',
            last_name: (user as any).lastName || (user as any).last_name || undefined,
            username: (user as any).username || undefined,
            phone_number: (user as any).phone || undefined,
            is_bot: (user as any).bot || false,
            language_code: (user as any).langCode || (user as any).lang_code || undefined,
            access_hash: (user as any).accessHash?.toString()
          };

          // Save session string
          const sessionString = client.session.save();

          // Update session
          session.status = 'authenticated';
          session.authenticated_at = Date.now();
          session.user = telegramUser;
          session.session_string = typeof sessionString === 'string' ? sessionString : '';

          return {
            success: true,
            user: telegramUser,
            sessionString: typeof sessionString === 'string' ? sessionString : ''
          };
        } else {
          console.error('Invalid user object structure:', user);
          return { success: false, error: 'Invalid user data received' };
        }
      }

      return { success: false, error: 'Unknown authentication result' };
    } catch (error: any) {
      // Check if 2FA is required
      if (error.message.includes('SESSION_PASSWORD_NEEDED')) {
        session.status = 'password_required';
        return { 
          success: false, 
          needsPassword: true,
          error: 'Two-factor authentication required' 
        };
      }

      console.error('Error verifying code:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to verify code' 
      };
    }
  }

  // Step 3: Verify 2FA password (if needed)
  async verifyPassword(sessionId: string, password: string): Promise<{
    success: boolean;
    user?: TelegramUser;
    sessionString?: string;
    error?: string;
  }> {
    const session = this.sessions.get(sessionId);
    const client = this.clients.get(sessionId);

    if (!session || !client || session.status !== 'password_required') {
      return { success: false, error: 'Invalid session or incorrect state' };
    }

    try {
      // Get password information
      const passwordInfo = await client.invoke(new Api.account.GetPassword());
      
      // Import the password utility
      const { computeCheck } = await import('telegram/Password');
      
      // Create password input
      const passwordSrp = await computeCheck(passwordInfo, password);
      
      // Check password
      const result = await client.invoke(
        new Api.auth.CheckPassword({
          password: passwordSrp
        })
      );

      if (result instanceof Api.auth.Authorization) {
        const user = result.user;
        
        console.log('User object received (password):', JSON.stringify(user, null, 2));
        
        // Type guard to ensure we have a User object
        if (user && typeof user === 'object' && 'id' in user) {
          const telegramUser: TelegramUser = {
            id: Number(user.id),
            first_name: (user as any).firstName || (user as any).first_name || '',
            last_name: (user as any).lastName || (user as any).last_name || undefined,
            username: (user as any).username || undefined,
            phone_number: (user as any).phone || undefined,
            is_bot: (user as any).bot || false,
            language_code: (user as any).langCode || (user as any).lang_code || undefined,
            access_hash: (user as any).accessHash?.toString()
          };

          // Save session string
          const sessionString = client.session.save();

          // Update session
          session.status = 'authenticated';
          session.authenticated_at = Date.now();
          session.user = telegramUser;
          session.session_string = typeof sessionString === 'string' ? sessionString : '';

          return {
            success: true,
            user: telegramUser,
            sessionString: typeof sessionString === 'string' ? sessionString : ''
          };
        } else {
          console.error('Invalid user object structure (password):', user);
          return { success: false, error: 'Invalid user data received' };
        }
      }

      return { success: false, error: 'Invalid password' };
    } catch (error: any) {
      console.error('Error verifying password:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to verify password' 
      };
    }
  }

  // Get session status
  getSession(sessionId: string): AuthSession | null {
    return this.sessions.get(sessionId) || null;
  }

  // Validate existing session string
  async validateSession(sessionString: string): Promise<{
    valid: boolean;
    user?: TelegramUser;
    error?: string;
  }> {
    try {
      const client = new TelegramClient(
        new StringSession(sessionString), 
        this.config.api_id, 
        this.config.api_hash,
        { connectionRetries: 5 }
      );

      await client.connect();

      // Get current user info
      const me = await client.getMe();
      
      console.log('Me object received:', JSON.stringify(me, null, 2));
      
      // Type guard to ensure we have a User object
      if (me && typeof me === 'object' && 'id' in me) {
        const telegramUser: TelegramUser = {
          id: Number(me.id),
          first_name: (me as any).firstName || (me as any).first_name || '',
          last_name: (me as any).lastName || (me as any).last_name || undefined,
          username: (me as any).username || undefined,
          phone_number: (me as any).phone || undefined,
          is_bot: (me as any).bot || false,
          language_code: (me as any).langCode || (me as any).lang_code || undefined,
          access_hash: (me as any).accessHash?.toString()
        };

        await client.disconnect();

        return {
          valid: true,
          user: telegramUser
        };
      } else {
        console.error('Invalid me object structure:', me);
        await client.disconnect();
        return {
          valid: false,
          error: 'Invalid user data received'
        };
      }
    } catch (error: any) {
      console.error('Error validating session:', error);
      return {
        valid: false,
        error: error.message || 'Invalid session'
      };
    }
  }

  // Clean up expired sessions
  private cleanupExpiredSessions(): void {
    const now = Date.now();
    const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.created_at > SESSION_TIMEOUT) {
        // Clean up client if exists
        const client = this.clients.get(sessionId);
        if (client) {
          client.disconnect().catch(console.error);
          this.clients.delete(sessionId);
        }
        this.sessions.delete(sessionId);
      }
    }
  }

  // Generate unique session ID
  private generateSessionId(): string {
    return `tg_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  // Disconnect client
  async disconnectSession(sessionId: string): Promise<void> {
    const client = this.clients.get(sessionId);
    if (client) {
      await client.disconnect();
      this.clients.delete(sessionId);
    }
    this.sessions.delete(sessionId);
  }
}

// Export singleton instance
export const telegramAuth = new TelegramUserAuth();