import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { TelegramDataService } from '@/lib/telegram/data';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authCookie = request.cookies.get('tipdao_auth')?.value;
    if (!authCookie) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(
      authCookie,
      process.env.JWT_SECRET || 'fallback-secret'
    ) as { telegram?: { user: { id: number } } };

    if (!decoded.telegram?.user) {
      return NextResponse.json(
        { error: 'Telegram not connected' },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') as 'private' | 'group' | 'supergroup' | 'channel' | 'all' || 'all';
    const search = searchParams.get('search') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Initialize Telegram data service
    const telegramData = new TelegramDataService('mock_token', decoded.telegram.user.id);

    // Fetch chats
    const chats = await telegramData.getUserChats({
      type,
      search,
      limit,
      offset
    });

    return NextResponse.json({
      chats,
      pagination: {
        limit,
        offset,
        total: chats.length, // In real implementation, this would be the total count
        hasMore: chats.length === limit
      }
    });
  } catch (error) {
    console.error('Error fetching Telegram chats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chats' },
      { status: 500 }
    );
  }
} 