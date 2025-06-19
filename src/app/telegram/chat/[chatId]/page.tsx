'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface TelegramChat {
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

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  phone_number?: string;
  auth_date: number;
  hash: string;
}

interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  date: number;
  chat: { id: number; type: string };
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
}

interface TelegramChatMember {
  user: TelegramUser;
  status: 'creator' | 'administrator' | 'member' | 'restricted' | 'left' | 'kicked';
  custom_title?: string;
  can_manage_chat?: boolean;
  can_delete_messages?: boolean;
  can_invite_users?: boolean;
  can_restrict_members?: boolean;
  can_pin_messages?: boolean;
  can_promote_members?: boolean;
}

interface TelegramChatStats {
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

export default function ChatDetailPage() {
  const params = useParams();
  const chatId = parseInt(params.chatId as string);

  const [chat, setChat] = useState<TelegramChat | null>(null);
  const [messages, setMessages] = useState<TelegramMessage[]>([]);
  const [members, setMembers] = useState<TelegramChatMember[]>([]);
  const [stats, setStats] = useState<TelegramChatStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'messages' | 'members'>('overview');
  const [messageFilter, setMessageFilter] = useState<'all' | 'text' | 'media' | 'documents'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (chatId) {
      fetchChatData();
    }
  }, [chatId]);

  useEffect(() => {
    if (chatId && activeTab === 'messages') {
      fetchMessages();
    }
  }, [chatId, activeTab, messageFilter, searchTerm]);

  const fetchChatData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/telegram/chats/${chatId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch chat data');
      }

      const data = await response.json();
      setChat(data.chat);
      setStats(data.stats);
      setMembers(data.members || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching chat data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch chat data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const params = new URLSearchParams({
        filter: messageFilter,
        limit: '50',
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`/api/telegram/chats/${chatId}/messages?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const getChatTitle = (chat: TelegramChat): string => {
    if (chat.title) return chat.title;
    if (chat.first_name) {
      return chat.last_name ? `${chat.first_name} ${chat.last_name}` : chat.first_name;
    }
    return chat.username || `Chat ${chat.id}`;
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const formatMessageText = (message: TelegramMessage): React.ReactNode => {
    if (!message.text) return <span>No text content</span>;

    const formattedText = message.text;
    const elements: React.ReactNode[] = [];
    let lastOffset = 0;

    // Process entities (URLs, mentions, etc.)
    if (message.entities) {
      message.entities.forEach((entity, index) => {
        // Add text before entity
        if (entity.offset > lastOffset) {
          elements.push(
            <span key={`text-${index}`}>
              {formattedText.slice(lastOffset, entity.offset)}
            </span>
          );
        }

        // Add the entity
        const entityText = formattedText.slice(entity.offset, entity.offset + entity.length);
        
        switch (entity.type) {
          case 'url':
            elements.push(
              <a
                key={`url-${index}`}
                href={entity.url || entityText}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {entityText}
              </a>
            );
            break;
          case 'mention':
            elements.push(
              <span key={`mention-${index}`} className="text-blue-600 font-medium">
                {entityText}
              </span>
            );
            break;
          case 'emoji':
            elements.push(
              <span key={`emoji-${index}`} className="text-lg">
                {entityText}
              </span>
            );
            break;
          default:
            elements.push(
              <span key={`entity-${index}`} className="font-medium">
                {entityText}
              </span>
            );
        }

        lastOffset = entity.offset + entity.length;
      });
    }

    // Add remaining text
    if (lastOffset < formattedText.length) {
      elements.push(
        <span key="text-end">
          {formattedText.slice(lastOffset)}
        </span>
      );
    }

    return <span>{elements}</span>;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (error || !chat) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Chat Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The requested chat could not be found.'}</p>
          <Link
            href="/telegram"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            ← Back to Chats
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xl">
                {getChatTitle(chat).charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{getChatTitle(chat)}</h1>
                <div className="flex items-center space-x-4 mt-1">
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                    chat.type === 'private' ? 'bg-blue-100 text-blue-800' :
                    chat.type === 'channel' ? 'bg-purple-100 text-purple-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {chat.type}
                  </span>
                  {chat.username && (
                    <span className="text-gray-600">@{chat.username}</span>
                  )}
                  {chat.participant_count && (
                    <span className="text-gray-600">
                      {chat.participant_count.toLocaleString()} {chat.type === 'channel' ? 'subscribers' : 'members'}
                    </span>
                  )}
                </div>
                {(chat.description || chat.bio) && (
                  <p className="text-gray-600 mt-2 max-w-2xl">
                    {chat.description || chat.bio}
                  </p>
                )}
              </div>
            </div>
            <Link
              href="/telegram"
              className="inline-flex items-center px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              ← Back to Chats
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'messages', label: 'Messages' },
              ...(chat.type !== 'private' ? [{ id: 'members', label: 'Members' }] : [])
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'overview' | 'messages' | 'members')}
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
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Total Messages</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.total_messages}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Text Messages</h3>
                <p className="text-2xl font-bold text-blue-600">{stats.text_messages}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Media Messages</h3>
                <p className="text-2xl font-bold text-green-600">{stats.media_messages}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Active Members</h3>
                <p className="text-2xl font-bold text-purple-600">{stats.active_members}</p>
              </div>
            </div>

            {/* Message Frequency */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Message Frequency</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Daily Average</p>
                  <p className="text-xl font-semibold text-gray-900">{stats.message_frequency.daily_average}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Weekly Average</p>
                  <p className="text-xl font-semibold text-gray-900">{stats.message_frequency.weekly_average}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Monthly Average</p>
                  <p className="text-xl font-semibold text-gray-900">{stats.message_frequency.monthly_average}</p>
                </div>
              </div>
            </div>

            {/* Most Active Users */}
            {stats.most_active_users.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Most Active Users</h3>
                <div className="space-y-3">
                  {stats.most_active_users.map((activeUser, index) => (
                    <div key={activeUser.user.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                        <div>
                          <p className="font-medium text-gray-900">
                            {activeUser.user.first_name} {activeUser.user.last_name}
                          </p>
                          {activeUser.user.username && (
                            <p className="text-sm text-gray-600">@{activeUser.user.username}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{activeUser.message_count}</p>
                        <p className="text-sm text-gray-500">messages</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="space-y-6">
            {/* Message Filters */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                    Search Messages
                  </label>
                  <input
                    type="text"
                    id="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search message content..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="filter" className="block text-sm font-medium text-gray-700 mb-2">
                    Message Type
                  </label>
                  <select
                    id="filter"
                    value={messageFilter}
                    onChange={(e) => setMessageFilter(e.target.value as 'all' | 'text' | 'media' | 'documents')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Messages</option>
                    <option value="text">Text Only</option>
                    <option value="media">Media</option>
                    <option value="documents">Documents</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Messages List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {messages.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-600">No messages found</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {messages.map((message) => (
                    <div key={message.message_id} className="p-6">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                          {message.from?.first_name?.charAt(0) || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-gray-900">
                              {message.from ? `${message.from.first_name} ${message.from.last_name || ''}` : 'Unknown'}
                            </p>
                            {message.from?.username && (
                              <span className="text-sm text-gray-600">@{message.from.username}</span>
                            )}
                            <span className="text-sm text-gray-500">
                              {formatDate(message.date)}
                            </span>
                          </div>
                          
                          <div className="mt-2">
                            {message.text && (
                              <p className="text-gray-800">{formatMessageText(message)}</p>
                            )}
                            
                            {message.photo && (
                              <div className="mt-2">
                                <span className="inline-flex items-center px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                                  📷 Photo
                                </span>
                              </div>
                            )}
                            
                            {message.document && (
                              <div className="mt-2">
                                <span className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                  📄 {message.document.file_name || 'Document'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'members' && chat.type !== 'private' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {members.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-600">No members found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {members.map((member) => (
                  <div key={member.user.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {member.user.first_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {member.user.first_name} {member.user.last_name}
                          </p>
                          {member.user.username && (
                            <p className="text-sm text-gray-600">@{member.user.username}</p>
                          )}
                          {member.custom_title && (
                            <p className="text-sm text-blue-600">{member.custom_title}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          member.status === 'creator' ? 'bg-red-100 text-red-800' :
                          member.status === 'administrator' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {member.status}
                        </span>
                        {member.status === 'administrator' && (
                          <div className="mt-1 text-xs text-gray-600">
                            {[
                              member.can_manage_chat && 'Manage',
                              member.can_delete_messages && 'Delete',
                              member.can_invite_users && 'Invite',
                              member.can_restrict_members && 'Restrict',
                              member.can_pin_messages && 'Pin'
                            ].filter(Boolean).join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 