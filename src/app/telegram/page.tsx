'use client';

import { useState, useEffect } from 'react';
import { TelegramChat, TelegramUserProfile } from '@/lib/telegram/data';
import Link from 'next/link';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  phone_number?: string;
  sessionString?: string;
}

export default function TelegramPage() {
  const [profile, setProfile] = useState<TelegramUserProfile | null>(null);
  const [chats, setChats] = useState<TelegramChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);

  useEffect(() => {
    // Check authentication via API endpoint
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const authData = await response.json();
          if (authData.telegram && authData.telegram.sessionId) {
            setUser(authData.telegram.user);
            await fetchData(authData.telegram.sessionId);
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
  }, []);

  const fetchData = async (sessionString: string) => {
    try {
      // Fetch profile and chats in parallel - JWT cookie will be automatically included
      const [profileResponse, chatsResponse] = await Promise.all([
        fetch('/api/telegram/profile', { 
          method: 'GET',
          credentials: 'include' // Ensure cookies are included
        }),
        fetch('/api/telegram/chats?limit=20', { 
          method: 'GET',
          credentials: 'include' // Ensure cookies are included
        })
      ]);

      if (!profileResponse.ok || !chatsResponse.ok) {
        throw new Error('Failed to fetch Telegram data');
      }

      const profileData = await profileResponse.json();
      const chatsData = await chatsResponse.json();

      if (profileData.success) {
        setProfile(profileData.profile);
      }

      if (chatsData.success) {
        setChats(chatsData.chats || []);
      }
    } catch (err: any) {
      console.error('Error fetching Telegram data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatLastSeen = (status?: TelegramUserProfile['status']) => {
    if (!status) return 'Unknown';
    
    switch (status.type) {
      case 'online':
        return 'Online';
      case 'recently':
        return 'Recently';
      case 'within_week':
        return 'Within a week';
      case 'within_month':
        return 'Within a month';
      case 'long_time_ago':
        return 'Long time ago';
      case 'offline':
        return status.last_seen 
          ? `Last seen ${new Date(status.last_seen * 1000).toLocaleDateString()}`
          : 'Offline';
      default:
        return 'Unknown';
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

  const formatLastMessage = (chat: TelegramChat) => {
    if (!chat.last_message) return 'No messages';
    
    const date = new Date(chat.last_message.date * 1000);
    const text = chat.last_message.text || 'Media message';
    const maxLength = 50;
    const truncatedText = text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    
    return `${truncatedText} • ${date.toLocaleDateString()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="h-24 w-24 bg-gray-300 rounded-full mx-auto mb-4"></div>
                  <div className="h-6 bg-gray-300 rounded w-3/4 mx-auto mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto"></div>
                </div>
              </div>
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <div className="h-12 w-12 bg-gray-300 rounded-full"></div>
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
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="text-red-500 text-xl mb-4">⚠️ Error</div>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link 
              href="/dashboard" 
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Telegram Integration</h1>
            <p className="text-gray-600 mt-1">Manage your Telegram chats and messages</p>
          </div>
          <Link 
            href="/dashboard" 
            className="inline-flex items-center px-4 py-2 bg-white text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
          >
            ← Dashboard
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile</h2>
              
              {profile && (
                <div className="text-center">
                  {/* Profile Photo Placeholder */}
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
                    {profile.first_name.charAt(0)}
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900">
                    {profile.first_name} {profile.last_name}
                    {profile.is_verified && <span className="text-blue-500 ml-1">✓</span>}
                    {profile.is_premium && <span className="text-yellow-500 ml-1">⭐</span>}
                  </h3>
                  
                  {profile.username && (
                    <p className="text-gray-600">@{profile.username}</p>
                  )}
                  
                  <div className="mt-4 space-y-2 text-sm text-gray-600">
                    <p><strong>Status:</strong> {formatLastSeen(profile.status)}</p>
                    {profile.phone && <p><strong>Phone:</strong> {profile.phone}</p>}
                    {profile.bio && (
                      <div>
                        <strong>Bio:</strong>
                        <p className="mt-1 text-gray-700">{profile.bio}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Chats Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Recent Chats</h2>
                <span className="text-sm text-gray-500">{chats.length} chats</span>
              </div>
              
              {chats.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No chats found</p>
              ) : (
                <div className="space-y-3">
                  {chats.map((chat) => (
                    <Link
                      key={chat.id}
                      href={`/telegram/chat/${chat.id}`}
                      className="block p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        {/* Chat Avatar */}
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white font-semibold">
                          {getChatDisplayName(chat).charAt(0).toUpperCase()}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-gray-900 truncate">
                              {getChatDisplayName(chat)}
                              {chat.is_verified && <span className="text-blue-500 ml-1">✓</span>}
                              {chat.is_scam && <span className="text-red-500 ml-1">⚠️</span>}
                            </h3>
                            {chat.unread_count && chat.unread_count > 0 && (
                              <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                                {chat.unread_count}
                              </span>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 truncate">
                            {getChatDescription(chat)}
                          </p>
                          
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            {formatLastMessage(chat)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 