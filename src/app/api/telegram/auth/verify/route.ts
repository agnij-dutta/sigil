import { NextRequest, NextResponse } from 'next/server';
import { telegramAuth } from '@/lib/telegram/auth';

export async function POST(request: NextRequest) {
  try {
    const authData = await request.json();
    
    if (!authData || typeof authData !== 'object') {
      return NextResponse.json(
        { error: 'Invalid authentication data' },
        { status: 400 }
      );
    }

    // Required fields for Telegram Login Widget
    const requiredFields = ['id', 'first_name', 'auth_date', 'hash'];
    for (const field of requiredFields) {
      if (!(field in authData)) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Verify the authentication data
    const isValid = telegramAuth.verifyTelegramAuth(authData);
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid authentication data' },
        { status: 401 }
      );
    }

    // Parse user data
    const user = telegramAuth.parseTelegramUser(authData);

    return NextResponse.json({
      success: true,
      user,
      message: 'Authentication successful'
    });
  } catch (error) {
    console.error('Telegram auth verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify authentication' },
      { status: 500 }
    );
  }
} 