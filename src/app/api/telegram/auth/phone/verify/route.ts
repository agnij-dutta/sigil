import { NextRequest, NextResponse } from 'next/server';
import { telegramAuth } from '@/lib/telegram/auth';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, code } = await request.json();
    
    if (!sessionId || !code) {
      return NextResponse.json(
        { error: 'sessionId and code are required' },
        { status: 400 }
      );
    }

    const result = await telegramAuth.verifyCode(sessionId, code);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error verifying code:', error);
    return NextResponse.json(
      { error: 'Failed to verify code' },
      { status: 500 }
    );
  }
} 