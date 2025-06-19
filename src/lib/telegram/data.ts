import { TelegramUser, TelegramChat, TelegramMessage, telegramAuth } from './auth';
import TelegramBot from 'node-telegram-bot-api';

export interface TelegramChatListOptions {
  limit?: number;
  offset?: number;
  type?: 'private' | 'group' | 'supergroup' | 'channel' | 'all';
  search?: string;
}

export interface TelegramMessageListOptions {
  limit?: number;
  offset?: number;
  from_message_id?: number;
  filter?: 'text' | 'media' | 'documents' | 'all';
  search?: string;
  date_from?: Date;
  date_to?: Date;
}

export interface TelegramChatMember {
  user: TelegramUser;
  status: 'creator' | 'administrator' | 'member' | 'restricted' | 'left' | 'kicked';
  until_date?: number;
  can_be_edited?: boolean;
  can_manage_chat?: boolean;
  can_change_info?: boolean;
  can_delete_messages?: boolean;
  can_invite_users?: boolean;
  can_restrict_members?: boolean;
  can_pin_messages?: boolean;
  can_promote_members?: boolean;
  can_manage_video_chats?: boolean;
  is_anonymous?: boolean;
  custom_title?: string;
  can_manage_voice_chats?: boolean;
}

export interface TelegramChatStats {
  total_messages: number;
  text_messages: number;
  media_messages: number;
  members_count: number;
  active_members: number;
  created_date?: string;
  last_activity: string;
  most_active_users: Array<{
    user: TelegramUser;
    message_count: number;
  }>;
  message_frequency: {
    daily_average: number;
    weekly_average: number;
    monthly_average: number;
  };
}

export interface TelegramBotInfo {
  id: number;
  is_bot: boolean;
  first_name: string;
  username: string;
  can_join_groups: boolean;
  can_read_all_group_messages: boolean;
  supports_inline_queries: boolean;
  can_connect_to_business: boolean;
  has_main_web_app: boolean;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
  channel_post?: TelegramMessage;
  edited_channel_post?: TelegramMessage;
  callback_query?: {
    id: string;
    from: TelegramUser;
    message?: TelegramMessage;
    data?: string;
  };
  inline_query?: {
    id: string;
    from: TelegramUser;
    query: string;
    offset: string;
  };
}

export class TelegramDataService {
  private authToken: string;
  private userId: number;
  private bot?: TelegramBot;

  constructor(authToken: string, userId: number) {
    this.authToken = authToken;
    this.userId = userId;
    this.bot = telegramAuth.getBot();
  }

  /**
   * Get bot information
   */
  async getBotInfo(): Promise<TelegramBotInfo | null> {
    if (!this.bot) {
      return null;
    }

    try {
      const me = await this.bot.getMe();
      return {
        id: me.id,
        is_bot: me.is_bot,
        first_name: me.first_name,
        username: me.username || '',
        can_join_groups: Boolean((me as TelegramBot.User & { can_join_groups?: boolean }).can_join_groups),
        can_read_all_group_messages: Boolean((me as TelegramBot.User & { can_read_all_group_messages?: boolean }).can_read_all_group_messages),
        supports_inline_queries: Boolean((me as TelegramBot.User & { supports_inline_queries?: boolean }).supports_inline_queries),
        can_connect_to_business: false, // Not available in current API
        has_main_web_app: false // Not available in current API
      };
    } catch (error) {
      console.error('Error fetching bot info:', error);
      return null;
    }
  }

  /**
   * Get all user's chats (DMs, groups, channels)
   */
  async getUserChats(options: TelegramChatListOptions = {}): Promise<TelegramChat[]> {
    try {
      // In a real implementation with MTProto API, you would fetch actual chats
      // For now, we'll provide comprehensive mock data
      const mockChats: TelegramChat[] = [
        {
          id: 1,
          type: 'private',
          first_name: 'John',
          last_name: 'Doe',
          username: 'johndoe',
          photo: {
            small_file_id: 'AgACAgIAAxkBAAICGWXxyz...',
            big_file_id: 'AgACAgIAAxkBAAICGWXxyz...'
          },
          bio: 'Full-stack developer passionate about blockchain'
        },
        {
          id: 2,
          type: 'group',
          title: 'Development Team',
          participant_count: 25,
          description: 'Main development team coordination',
          permissions: {
            can_send_messages: true,
            can_send_media_messages: true,
            can_send_polls: true,
            can_send_other_messages: true,
            can_add_web_page_previews: true,
            can_change_info: false,
            can_invite_users: true,
            can_pin_messages: false
          }
        },
        {
          id: 3,
          type: 'supergroup',
          title: 'TipDAO Community',
          username: 'tipdao_official',
          participant_count: 1250,
          description: 'Official TipDAO community for discussions, updates, and collaboration'
        },
        {
          id: 4,
          type: 'channel',
          title: 'TipDAO Announcements',
          username: 'tipdao_announcements',
          participant_count: 5420,
          description: 'Official announcements and updates from TipDAO team'
        },
        {
          id: 5,
          type: 'private',
          first_name: 'Alice',
          last_name: 'Smith',
          username: 'alice_dev',
          bio: 'UI/UX Designer & Frontend Developer'
        },
        {
          id: 6,
          type: 'group',
          title: 'Web3 Builders',
          participant_count: 180,
          description: 'Community of Web3 developers and blockchain enthusiasts'
        }
      ];

      // Apply filters
      let filteredChats = [...mockChats];
      
      if (options.type && options.type !== 'all') {
        filteredChats = filteredChats.filter(chat => chat.type === options.type);
      }

      if (options.search) {
        const searchLower = options.search.toLowerCase();
        filteredChats = filteredChats.filter(chat => 
          chat.title?.toLowerCase().includes(searchLower) ||
          chat.first_name?.toLowerCase().includes(searchLower) ||
          chat.last_name?.toLowerCase().includes(searchLower) ||
          chat.username?.toLowerCase().includes(searchLower) ||
          chat.description?.toLowerCase().includes(searchLower)
        );
      }

      // Apply pagination
      const offset = options.offset || 0;
      const limit = options.limit || 50;
      
      return filteredChats.slice(offset, offset + limit);
    } catch (error) {
      console.error('Error fetching user chats:', error);
      throw error;
    }
  }

  /**
   * Get messages from a specific chat
   */
  async getChatMessages(
    chatId: number, 
    options: TelegramMessageListOptions = {}
  ): Promise<TelegramMessage[]> {
    try {
      // Generate comprehensive mock messages
      const now = Math.floor(Date.now() / 1000);
      const mockMessages: TelegramMessage[] = [
        {
          message_id: 1,
          date: now - 3600, // 1 hour ago
          chat: { id: chatId, type: 'private' },
          text: 'Hey! How\'s the TipDAO project coming along?',
          from: {
            id: 123,
            first_name: 'Alice',
            username: 'alice_dev',
            auth_date: now,
            hash: 'hash_alice_123'
          }
        },
        {
          message_id: 2,
          date: now - 3000, // 50 minutes ago
          chat: { id: chatId, type: 'private' },
          text: 'It\'s going great! We just integrated GitHub and now working on Telegram features.',
          from: {
            id: this.userId,
            first_name: 'You',
            auth_date: now,
            hash: 'hash_you_456'
          }
        },
        {
          message_id: 3,
          date: now - 2400, // 40 minutes ago
          chat: { id: chatId, type: 'private' },
          text: 'That sounds amazing! Can\'t wait to try it out 🚀',
          from: {
            id: 123,
            first_name: 'Alice',
            username: 'alice_dev',
            auth_date: now,
            hash: 'hash_alice_123'
          },
          entities: [
            {
              type: 'emoji',
              offset: 44,
              length: 2
            }
          ]
        },
        {
          message_id: 4,
          date: now - 1800, // 30 minutes ago
          chat: { id: chatId, type: 'private' },
          photo: [
            {
              file_id: 'AgACAgIAAxkBAAICGWXxyz123...',
              file_unique_id: 'AQADG4sxG_abc123',
              width: 1280,
              height: 720,
              file_size: 95432
            }
          ],
          from: {
            id: this.userId,
            first_name: 'You',
            auth_date: now,
            hash: 'hash_you_456'
          }
        },
        {
          message_id: 5,
          date: now - 900, // 15 minutes ago
          chat: { id: chatId, type: 'private' },
          text: 'Check out this documentation link:',
          entities: [
            {
              type: 'url',
              offset: 10,
              length: 23,
              url: 'https://docs.tipdao.org'
            }
          ],
          from: {
            id: 123,
            first_name: 'Alice',
            username: 'alice_dev',
            auth_date: now,
            hash: 'hash_alice_123'
          }
        }
      ];

      // Apply filters
      let filteredMessages = [...mockMessages];

      if (options.filter && options.filter !== 'all') {
        switch (options.filter) {
          case 'text':
            filteredMessages = filteredMessages.filter(m => m.text && !m.photo && !m.document);
            break;
          case 'media':
            filteredMessages = filteredMessages.filter(m => m.photo || m.document);
            break;
          case 'documents':
            filteredMessages = filteredMessages.filter(m => m.document);
            break;
        }
      }

      if (options.search) {
        const searchLower = options.search.toLowerCase();
        filteredMessages = filteredMessages.filter(m => 
          m.text?.toLowerCase().includes(searchLower)
        );
      }

      if (options.date_from) {
        const fromTimestamp = Math.floor(options.date_from.getTime() / 1000);
        filteredMessages = filteredMessages.filter(m => m.date >= fromTimestamp);
      }

      if (options.date_to) {
        const toTimestamp = Math.floor(options.date_to.getTime() / 1000);
        filteredMessages = filteredMessages.filter(m => m.date <= toTimestamp);
      }

      // Apply pagination
      const limit = options.limit || 100;
      const offset = options.offset || 0;
      
      return filteredMessages.slice(offset, offset + limit);
    } catch (error) {
      console.error(`Error fetching messages for chat ${chatId}:`, error);
      throw error;
    }
  }

  /**
   * Get private chats (DMs)
   */
  async getPrivateChats(): Promise<TelegramChat[]> {
    return this.getUserChats({ type: 'private' });
  }

  /**
   * Get group chats
   */
  async getGroupChats(): Promise<TelegramChat[]> {
    const groups = await this.getUserChats({ type: 'group' });
    const supergroups = await this.getUserChats({ type: 'supergroup' });
    return [...groups, ...supergroups];
  }

  /**
   * Get channels
   */
  async getChannels(): Promise<TelegramChat[]> {
    return this.getUserChats({ type: 'channel' });
  }

  /**
   * Get chat members (for groups/channels)
   */
  async getChatMembers(chatId: number): Promise<TelegramChatMember[]> {
    try {
      // Enhanced mock members with more realistic data
      const mockMembers: TelegramChatMember[] = [
        {
          user: {
            id: 123,
            first_name: 'Alice',
            last_name: 'Johnson',
            username: 'alice_admin',
            auth_date: Math.floor(Date.now() / 1000),
            hash: 'hash_alice_admin'
          },
          status: 'administrator',
          can_manage_chat: true,
          can_delete_messages: true,
          can_invite_users: true,
          can_restrict_members: true,
          can_pin_messages: true,
          can_promote_members: false,
          custom_title: 'Lead Developer'
        },
        {
          user: {
            id: 456,
            first_name: 'Bob',
            last_name: 'Smith',
            username: 'bob_member',
            auth_date: Math.floor(Date.now() / 1000),
            hash: 'hash_bob_member'
          },
          status: 'member'
        },
        {
          user: {
            id: 789,
            first_name: 'Charlie',
            last_name: 'Brown',
            username: 'charlie_mod',
            auth_date: Math.floor(Date.now() / 1000),
            hash: 'hash_charlie_mod'
          },
          status: 'administrator',
          can_manage_chat: false,
          can_delete_messages: true,
          can_invite_users: true,
          can_restrict_members: true,
          can_pin_messages: true,
          custom_title: 'Moderator'
        }
      ];

      return mockMembers;
    } catch (error) {
      console.error(`Error fetching members for chat ${chatId}:`, error);
      throw error;
    }
  }

  /**
   * Get enhanced chat statistics
   */
  async getChatStats(chatId: number): Promise<TelegramChatStats> {
    try {
      const messages = await this.getChatMessages(chatId);
      const members = await this.getChatMembers(chatId);

      const textMessages = messages.filter(m => m.text && !m.photo && !m.document).length;
      const mediaMessages = messages.filter(m => m.photo || m.document).length;

      // Calculate user activity
      const userActivity = new Map<number, number>();
      messages.forEach(message => {
        if (message.from) {
          const count = userActivity.get(message.from.id) || 0;
          userActivity.set(message.from.id, count + 1);
        }
      });

      const mostActiveUsers = Array.from(userActivity.entries())
        .map(([userId, count]) => {
          const user = messages.find(m => m.from?.id === userId)?.from;
          return user ? { user, message_count: count } : null;
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
        .sort((a, b) => b.message_count - a.message_count)
        .slice(0, 5);

      // Calculate message frequency (mock data)
      const totalDays = 30; // Assume 30 days of data
      const totalWeeks = 4;
      const totalMonths = 1;

      return {
        total_messages: messages.length,
        text_messages: textMessages,
        media_messages: mediaMessages,
        members_count: members.length,
        active_members: userActivity.size,
        created_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
        last_activity: new Date(Math.max(...messages.map(m => m.date * 1000))).toISOString(),
        most_active_users: mostActiveUsers,
        message_frequency: {
          daily_average: Math.round(messages.length / totalDays * 10) / 10,
          weekly_average: Math.round(messages.length / totalWeeks * 10) / 10,
          monthly_average: Math.round(messages.length / totalMonths * 10) / 10
        }
      };
    } catch (error) {
      console.error(`Error calculating stats for chat ${chatId}:`, error);
      throw error;
    }
  }

  /**
   * Search messages across all chats or specific chat
   */
  async searchMessages(query: string, chatId?: number): Promise<TelegramMessage[]> {
    try {
      if (chatId) {
        return this.getChatMessages(chatId, { search: query, limit: 1000 });
      }

      // Search across all chats
      const chats = await this.getUserChats({ limit: 1000 });
      const allResults: TelegramMessage[] = [];

      for (const chat of chats) {
        const messages = await this.getChatMessages(chat.id, { 
          search: query, 
          limit: 100 
        });
        allResults.push(...messages);
      }

      // Sort by relevance and date
      return allResults
        .sort((a, b) => b.date - a.date)
        .slice(0, 100); // Limit results
    } catch (error) {
      console.error('Error searching messages:', error);
      throw error;
    }
  }

  /**
   * Get recent activity across all chats
   */
  async getRecentActivity(limit: number = 20): Promise<TelegramMessage[]> {
    try {
      const chats = await this.getUserChats({ limit: 50 });
      const allMessages: TelegramMessage[] = [];

      for (const chat of chats) {
        const messages = await this.getChatMessages(chat.id, { limit: 10 });
        allMessages.push(...messages);
      }

      return allMessages
        .sort((a, b) => b.date - a.date)
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      throw error;
    }
  }

  /**
   * Export chat data for backup or analysis
   */
  async exportChatData(chatId: number): Promise<{
    chat: TelegramChat;
    messages: TelegramMessage[];
    members?: TelegramChatMember[];
    stats: TelegramChatStats;
  }> {
    try {
      const chats = await this.getUserChats();
      const chat = chats.find(c => c.id === chatId);
      
      if (!chat) {
        throw new Error('Chat not found');
      }

      const [messages, members, stats] = await Promise.all([
        this.getChatMessages(chatId, { limit: 10000 }),
        this.getChatMembers(chatId),
        this.getChatStats(chatId)
      ]);

      return {
        chat,
        messages,
        members: chat.type !== 'private' ? members : undefined,
        stats
      };
    } catch (error) {
      console.error(`Error exporting chat data for ${chatId}:`, error);
      throw error;
    }
  }

  /**
   * Send message via bot (if bot is configured)
   */
  async sendMessage(chatId: number, text: string, options?: TelegramBot.SendMessageOptions): Promise<TelegramMessage | null> {
    if (!this.bot) {
      console.warn('Bot not configured, cannot send message');
      return null;
    }

    try {
      const sentMessage = await this.bot.sendMessage(chatId, text, options);
      return sentMessage as TelegramMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Get webhook updates (for webhook mode)
   */
  async getUpdates(options?: { offset?: number; limit?: number; timeout?: number }): Promise<TelegramUpdate[]> {
    if (!this.bot) {
      return [];
    }

    try {
      const updates = await this.bot.getUpdates(options);
      return updates as TelegramUpdate[];
    } catch (error) {
      console.error('Error getting updates:', error);
      return [];
    }
  }
} 