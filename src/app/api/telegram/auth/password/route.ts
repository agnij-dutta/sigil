import { NextRequest, NextResponse } from 'next/server';
import { telegramAuth } from '@/lib/telegram/auth';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, password } = await request.json();
    
    if (!sessionId || !password) {
      return NextResponse.json(
        { error: 'sessionId and password are required' },
        { status: 400 }
      );
    }

    const result = await telegramAuth.verifyPassword(sessionId, password);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error verifying password:', error);
    return NextResponse.json(
      { error: 'Failed to verify password' },
      { status: 500 }
    );
  }
} 