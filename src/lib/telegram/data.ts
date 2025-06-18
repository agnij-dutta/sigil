import { TelegramUser, TelegramChat, TelegramMessage } from './auth';

export interface TelegramChatListOptions {
  limit?: number;
  offset?: number;
  type?: 'private' | 'group' | 'supergroup' | 'channel' | 'all';
}

export interface TelegramMessageListOptions {
  limit?: number;
  offset?: number;
  from_message_id?: number;
  filter?: 'text' | 'media' | 'documents' | 'all';
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
}

export interface TelegramChatStats {
  total_messages: number;
  text_messages: number;
  media_messages: number;
  members_count: number;
  active_members: number;
  created_date?: string;
  last_activity: string;
}

export class TelegramDataService {
  private authToken: string;
  private userId: number;

  constructor(authToken: string, userId: number) {
    this.authToken = authToken;
    this.userId = userId;
  }

  /**
   * Get all user's chats (DMs, groups, channels)
   */
  async getUserChats(options: TelegramChatListOptions = {}): Promise<TelegramChat[]> {
    try {
      // Mock chats - in real implementation, you'd use Telegram Client API
      const mockChats: TelegramChat[] = [
        {
          id: 1,
          type: 'private',
          first_name: 'John',
          last_name: 'Doe',
          username: 'johndoe',
          photo: {
            small_file_id: 'photo_small_1',
            big_file_id: 'photo_big_1'
          }
        },
        {
          id: 2,
          type: 'group',
          title: 'Dev Team',
          participant_count: 15,
          description: 'Development team chat'
        }
      ];

      // Apply filters and pagination
      let filteredChats = mockChats;
      if (options.type && options.type !== 'all') {
        filteredChats = mockChats.filter(chat => chat.type === options.type);
      }

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
      // Mock messages
      const mockMessages: TelegramMessage[] = [
        {
          message_id: 1,
          date: Math.floor(Date.now() / 1000),
          chat: { id: chatId, type: 'private' },
          text: 'Hello! How are you doing?',
          from: {
            id: 123,
            first_name: 'Alice',
            username: 'alice_user',
            auth_date: Math.floor(Date.now() / 1000),
            hash: 'mock_hash'
          }
        }
      ];

      const limit = options.limit || 100;
      const offset = options.offset || 0;
      
      return mockMessages.slice(offset, offset + limit);
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
      // Mock members - in real implementation, you'd use Telegram Client API
      const mockMembers: TelegramChatMember[] = [
        {
          user: {
            id: 123,
            first_name: 'Alice',
            username: 'alice_admin',
            auth_date: Math.floor(Date.now() / 1000),
            hash: 'mock_hash'
          },
          status: 'administrator',
          can_manage_chat: true,
          can_delete_messages: true,
          can_invite_users: true
        },
        {
          user: {
            id: 456,
            first_name: 'Bob',
            username: 'bob_member',
            auth_date: Math.floor(Date.now() / 1000),
            hash: 'mock_hash'
          },
          status: 'member'
        }
      ];

      return mockMembers;
    } catch (error) {
      console.error(`Error fetching members for chat ${chatId}:`, error);
      throw error;
    }
  }

  /**
   * Get chat statistics
   */
  async getChatStats(chatId: number): Promise<TelegramChatStats> {
    try {
      const messages = await this.getChatMessages(chatId);
      const members = await this.getChatMembers(chatId);

      const textMessages = messages.filter(m => m.text && !m.photo && !m.document).length;
      const mediaMessages = messages.filter(m => m.photo || m.document).length;

      return {
        total_messages: messages.length,
        text_messages: textMessages,
        media_messages: mediaMessages,
        members_count: members.length,
        active_members: members.filter(m => m.status === 'member' || m.status === 'administrator').length,
        last_activity: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error fetching stats for chat ${chatId}:`, error);
      throw error;
    }
  }

  /**
   * Search messages across all chats
   */
  async searchMessages(query: string, chatId?: number): Promise<TelegramMessage[]> {
    try {
      if (chatId) {
        const messages = await this.getChatMessages(chatId);
        return messages.filter(message => 
          message.text?.toLowerCase().includes(query.toLowerCase())
        );
      } else {
        // Search across all chats
        const chats = await this.getUserChats();
        const allMessages: TelegramMessage[] = [];
        
        for (const chat of chats) {
          const messages = await this.getChatMessages(chat.id);
          const filtered = messages.filter(message => 
            message.text?.toLowerCase().includes(query.toLowerCase())
          );
          allMessages.push(...filtered);
        }
        
        return allMessages;
      }
    } catch (error) {
      console.error(`Error searching messages for query "${query}":`, error);
      throw error;
    }
  }

  /**
   * Get recent activity across all chats
   */
  async getRecentActivity(limit: number = 20): Promise<TelegramMessage[]> {
    try {
      const chats = await this.getUserChats();
      const allMessages: TelegramMessage[] = [];
      
      for (const chat of chats) {
        const messages = await this.getChatMessages(chat.id, { limit: 5 });
        allMessages.push(...messages);
      }
      
      // Sort by date and return most recent
      return allMessages
        .sort((a, b) => b.date - a.date)
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      throw error;
    }
  }

  /**
   * Export chat data
   */
  async exportChatData(chatId: number): Promise<{
    chat: TelegramChat;
    messages: TelegramMessage[];
    members?: TelegramChatMember[];
    stats: TelegramChatStats;
  }> {
    try {
      const chat = (await this.getUserChats()).find(c => c.id === chatId);
      if (!chat) {
        throw new Error(`Chat ${chatId} not found`);
      }

      const [messages, members, stats] = await Promise.all([
        this.getChatMessages(chatId),
        chat.type !== 'private' ? this.getChatMembers(chatId) : Promise.resolve(undefined),
        this.getChatStats(chatId)
      ]);

      return {
        chat,
        messages,
        members,
        stats
      };
    } catch (error) {
      console.error(`Error exporting data for chat ${chatId}:`, error);
      throw error;
    }
  }
} 