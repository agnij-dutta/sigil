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

    // Initialize Telegram data service
    const telegramData = new TelegramDataService('mock_token', decoded.telegram.user.id);

    // Find the chat
    const chats = await telegramData.getUserChats({ limit: 1000 });
    const chat = chats.find(c => c.id === chatId);

    if (!chat) {
      return NextResponse.json(
        { error: 'Chat not found' },
        { status: 404 }
      );
    }

    // Get additional chat data
    const [stats, members] = await Promise.all([
      telegramData.getChatStats(chatId),
      chat.type !== 'private' ? telegramData.getChatMembers(chatId) : Promise.resolve([])
    ]);

    return NextResponse.json({
      chat,
      stats,
      members: chat.type !== 'private' ? members : undefined
    });
  } catch (error) {
    console.error('Error fetching Telegram chat details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat details' },
      { status: 500 }
    );
  }
} 