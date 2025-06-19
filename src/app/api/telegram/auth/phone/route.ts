import { NextRequest, NextResponse } from 'next/server';
import { telegramAuth } from '@/lib/telegram/auth';

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber } = await request.json();
    
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Basic phone number validation
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s+/g, ''))) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // Generate session ID and auth code
    const sessionId = telegramAuth.generateSessionId();
    const { authCode } = await telegramAuth.generatePhoneAuth(phoneNumber, sessionId);

    return NextResponse.json({
      success: true,
      sessionId,
      message: 'Verification code sent',
      // Include auth code in development for testing
      ...(process.env.NODE_ENV === 'development' && { authCode })
    });
  } catch (error) {
    console.error('Telegram phone auth error:', error);
    return NextResponse.json(
      { error: 'Failed to send verification code' },
      { status: 500 }
    );
  }
} 