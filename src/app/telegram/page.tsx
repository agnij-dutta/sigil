'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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
}

export default function TelegramPage() {
  const [chats, setChats] = useState<TelegramChat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'private' | 'group' | 'channel'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'type' | 'members'>('name');

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  const checkAuthAndFetchData = async () => {
    try {
      // Check authentication status
      const authResponse = await fetch('/api/auth/me');
      if (!authResponse.ok) {
        throw new Error('Not authenticated');
      }

      const authData = await authResponse.json();
      if (!authData.telegram?.user) {
        throw new Error('Telegram not connected');
      }

      setUser(authData.telegram.user);
      await fetchChats();
    } catch (error) {
      console.error('Auth check failed:', error);
      setError(error instanceof Error ? error.message : 'Authentication failed');
      setIsLoading(false);
    }
  };

  const fetchChats = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        type: selectedType,
        ...(searchTerm && { search: searchTerm }),
        limit: '100'
      });

      const response = await fetch(`/api/telegram/chats?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch chats');
      }

      const data = await response.json();
      setChats(data.chats || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching chats:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch chats');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchChats();
    }
  }, [selectedType, searchTerm]);

  const getChatTitle = (chat: TelegramChat): string => {
    if (chat.title) return chat.title;
    if (chat.first_name) {
      return chat.last_name ? `${chat.first_name} ${chat.last_name}` : chat.first_name;
    }
    return chat.username || `Chat ${chat.id}`;
  };

  const getChatSubtitle = (chat: TelegramChat): string => {
    if (chat.type === 'private') {
      return chat.username ? `@${chat.username}` : (chat.bio || 'Private chat');
    }
    if (chat.type === 'channel') {
      return `Channel • ${chat.participant_count?.toLocaleString() || 0} subscribers`;
    }
    if (chat.type === 'group' || chat.type === 'supergroup') {
      return `${chat.type === 'supergroup' ? 'Supergroup' : 'Group'} • ${chat.participant_count?.toLocaleString() || 0} members`;
    }
    return chat.description || 'Chat';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'private':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        );
      case 'group':
      case 'supergroup':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A2.999 2.999 0 0 0 17.1 7H16c-.8 0-1.5.5-1.8 1.2L12 14l-2.2-5.8C9.5 7.5 8.8 7 8 7H6.9c-1.3 0-2.4.84-2.86 2.37L1.5 16H4v6h4v-6h2v6h4v-6h2v6h4z"/>
          </svg>
        );
      case 'channel':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
          </svg>
        );
      default:
        return null;
    }
  };

  const sortedChats = [...chats].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return getChatTitle(a).localeCompare(getChatTitle(b));
      case 'type':
        return a.type.localeCompare(b.type);
      case 'members':
        return (b.participant_count || 0) - (a.participant_count || 0);
      default:
        return 0;
    }
  });

  if (error && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Telegram Integration</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Dashboard
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
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Telegram Chats</h1>
              {user && (
                <p className="text-gray-600 mt-1">
                  Connected as {user.first_name} {user.last_name && user.last_name}
                  {user.username && ` (@${user.username})`}
                </p>
              )}
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Search Chats
              </label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, username, or description..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Type Filter */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                Chat Type
              </label>
              <select
                id="type"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as 'all' | 'private' | 'group' | 'channel')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="private">Private Chats</option>
                <option value="group">Groups</option>
                <option value="channel">Channels</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                id="sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'type' | 'members')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="name">Name</option>
                <option value="type">Type</option>
                <option value="members">Member Count</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Chats</h3>
            <p className="text-2xl font-bold text-gray-900">{chats.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Private Chats</h3>
            <p className="text-2xl font-bold text-blue-600">
              {chats.filter(c => c.type === 'private').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Groups</h3>
            <p className="text-2xl font-bold text-green-600">
              {chats.filter(c => c.type === 'group' || c.type === 'supergroup').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Channels</h3>
            <p className="text-2xl font-bold text-purple-600">
              {chats.filter(c => c.type === 'channel').length}
            </p>
          </div>
        </div>

        {/* Chats List */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading chats...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchChats}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : sortedChats.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">
              {searchTerm || selectedType !== 'all' 
                ? 'No chats match your filters' 
                : 'No chats found'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="divide-y divide-gray-200">
              {sortedChats.map((chat) => (
                <Link
                  key={chat.id}
                  href={`/telegram/chat/${chat.id}`}
                  className="block hover:bg-gray-50 transition-colors"
                >
                  <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {getChatTitle(chat).charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            {getTypeIcon(chat.type)}
                            <h3 className="text-lg font-medium text-gray-900 truncate">
                              {getChatTitle(chat)}
                            </h3>
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                              chat.type === 'private' ? 'bg-blue-100 text-blue-800' :
                              chat.type === 'channel' ? 'bg-purple-100 text-purple-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {chat.type}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 truncate">
                            {getChatSubtitle(chat)}
                          </p>
                          {chat.description && (
                            <p className="text-xs text-gray-500 mt-1 truncate">
                              {chat.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        {chat.participant_count !== undefined && (
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {chat.participant_count.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500">
                              {chat.type === 'channel' ? 'subscribers' : 'members'}
                            </p>
                          </div>
                        )}
                        <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 