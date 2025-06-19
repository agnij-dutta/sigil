import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { TelegramDataService } from '@/lib/telegram/data';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const resolvedParams = await params;
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

    const chatId = parseInt(resolvedParams.chatId);
    if (isNaN(chatId)) {
      return NextResponse.json(
        { error: 'Invalid chat ID' },
        { status: 400 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const filter = searchParams.get('filter') as 'text' | 'media' | 'documents' | 'all' || 'all';
    const search = searchParams.get('search') || undefined;
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const dateFrom = searchParams.get('date_from') ? new Date(searchParams.get('date_from')!) : undefined;
    const dateTo = searchParams.get('date_to') ? new Date(searchParams.get('date_to')!) : undefined;

    // Initialize Telegram data service
    const telegramData = new TelegramDataService('mock_token', decoded.telegram.user.id);

    // Fetch messages
    const messages = await telegramData.getChatMessages(chatId, {
      filter,
      search,
      limit,
      offset,
      date_from: dateFrom,
      date_to: dateTo
    });

    return NextResponse.json({
      messages,
      chatId,
      pagination: {
        limit,
        offset,
        total: messages.length, // In real implementation, this would be the total count
        hasMore: messages.length === limit
      },
      filters: {
        filter,
        search,
        date_from: dateFrom?.toISOString(),
        date_to: dateTo?.toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching Telegram messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
} 