import { NextRequest, NextResponse } from 'next/server';
import { telegramAuth } from '@/lib/telegram/auth';

export async function POST(request: NextRequest) {
  try {
    const { sessionString } = await request.json();
    
    if (!sessionString) {
      return NextResponse.json(
        { error: 'sessionString is required' },
        { status: 400 }
      );
    }

    const result = await telegramAuth.validateSession(sessionString);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error validating session:', error);
    return NextResponse.json(
      { error: 'Failed to validate session' },
      { status: 500 }
    );
  }
} 