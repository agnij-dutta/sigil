'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { TelegramChat, TelegramMessage } from '@/lib/telegram/data';
import Link from 'next/link';

export default function TelegramChatPage() {
  const params = useParams();
  const chatId = params.chatId as string;
  
  const [chat, setChat] = useState<TelegramChat | null>(null);
  const [messages, setMessages] = useState<TelegramMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check authentication via API endpoint
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const authData = await response.json();
          if (authData.telegram && authData.telegram.sessionId) {
            await fetchChatData(authData.telegram.sessionId);
          } else {
            setError('Not authenticated with Telegram');
            setLoading(false);
          }
        } else {
          setError('Not authenticated with Telegram');
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setError('Authentication check failed');
        setLoading(false);
      }
    };

    checkAuth();
  }, [chatId]);

  const fetchChatData = async (sessionString: string) => {
    try {
      // Fetch chat info and messages in parallel - JWT cookie will be automatically included
      const [chatResponse, messagesResponse] = await Promise.all([
        fetch('/api/telegram/chats', { 
          method: 'GET',
          credentials: 'include'
        }).then(res => res.json()),
        fetch(`/api/telegram/chats/${chatId}/messages?limit=50`, { 
          method: 'GET',
          credentials: 'include'
        })
      ]);

      // Find the specific chat from the chats list
      if (chatResponse.success && chatResponse.chats) {
        const foundChat = chatResponse.chats.find((c: TelegramChat) => c.id === chatId);
        if (foundChat) {
          setChat(foundChat);
        } else {
          setError('Chat not found');
        }
      }

      // Handle messages response
      if (!messagesResponse.ok) {
        throw new Error('Failed to fetch messages');
      }

      const messagesData = await messagesResponse.json();
      if (messagesData.success) {
        setMessages(messagesData.messages || []);
      }
    } catch (err: any) {
      console.error('Error fetching chat data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getChatDisplayName = (chat: TelegramChat) => {
    if (chat.type === 'private') {
      return `${chat.first_name || ''} ${chat.last_name || ''}`.trim() || chat.username || 'Unknown';
    }
    return chat.title || chat.username || 'Unknown Chat';
  };

  const getChatDescription = (chat: TelegramChat) => {
    if (chat.type === 'private') {
      return chat.username ? `@${chat.username}` : 'Private chat';
    }
    
    const typeMap = {
      group: 'Group',
      supergroup: 'Supergroup',
      channel: 'Channel'
    };
    
    let desc = typeMap[chat.type as keyof typeof typeMap] || 'Chat';
    if (chat.participant_count) {
      desc += ` • ${chat.participant_count.toLocaleString()} members`;
    }
    return desc;
  };

  const formatMessageDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  const getMediaIcon = (mediaType: string) => {
    switch (mediaType) {
      case 'photo':
        return '📷';
      case 'video':
        return '🎥';
      case 'audio':
        return '🎵';
      case 'document':
        return '📄';
      case 'sticker':
        return '😊';
      default:
        return '📎';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-8"></div>
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="space-y-4">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="flex space-x-3">
                    <div className="h-8 w-8 bg-gray-300 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="text-red-500 text-xl mb-4">⚠️ Error</div>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link 
              href="/telegram" 
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              ← Back to Chats
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {chat ? getChatDisplayName(chat) : 'Chat'}
            </h1>
            {chat && (
              <p className="text-gray-600 mt-1">{getChatDescription(chat)}</p>
            )}
          </div>
          <Link 
            href="/telegram" 
            className="inline-flex items-center px-4 py-2 bg-white text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
          >
            ← Back to Chats
          </Link>
        </div>

        {/* Chat Info */}
        {chat && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xl font-bold">
                {getChatDisplayName(chat).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {getChatDisplayName(chat)}
                  </h2>
                  {chat.is_verified && <span className="text-blue-500">✓</span>}
                  {chat.is_scam && <span className="text-red-500">⚠️</span>}
                </div>
                <p className="text-gray-600">{getChatDescription(chat)}</p>
                {chat.description && (
                  <p className="text-gray-500 mt-1">{chat.description}</p>
                )}
              </div>
              {chat.unread_count && chat.unread_count > 0 && (
                <div className="bg-blue-500 text-white text-sm px-3 py-1 rounded-full">
                  {chat.unread_count} unread
                </div>
              )}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Messages</h3>
            <span className="text-sm text-gray-500">{messages.length} messages</span>
          </div>

          {messages.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No messages found</p>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {messages.map((message) => (
                <div key={message.id} className="flex space-x-3 p-3 rounded-lg hover:bg-gray-50">
                  {/* Message Avatar */}
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                    {message.from_user?.first_name ? 
                      message.from_user.first_name.charAt(0).toUpperCase() : 
                      '?'
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Message Header */}
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-gray-900 text-sm">
                        {message.from_user?.first_name || 'Unknown User'}
                        {message.from_user?.username && (
                          <span className="text-gray-500 font-normal"> @{message.from_user.username}</span>
                        )}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatMessageDate(message.date)}
                      </span>
                      {message.edit_date && (
                        <span className="text-xs text-gray-400">(edited)</span>
                      )}
                    </div>

                    {/* Message Content */}
                    <div className="text-gray-700">
                      {message.reply_to && (
                        <div className="bg-gray-100 border-l-4 border-gray-300 pl-3 py-1 mb-2 text-sm text-gray-600">
                          ↳ Reply to message #{message.reply_to.message_id}
                        </div>
                      )}

                      {message.text ? (
                        <p className="whitespace-pre-wrap break-words">{message.text}</p>
                      ) : message.media ? (
                        <div className="flex items-center space-x-2 text-gray-600">
                          <span className="text-lg">{getMediaIcon(message.media.type)}</span>
                          <span className="capitalize">{message.media.type}</span>
                          {message.media.caption && (
                            <span className="text-gray-500">- {message.media.caption}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-500 italic">No content</span>
                      )}

                      {message.forward_from && (
                        <div className="text-xs text-gray-500 mt-1">
                          Forwarded from {message.forward_from.user_id || message.forward_from.chat_id}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 