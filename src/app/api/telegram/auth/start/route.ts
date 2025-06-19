import { NextResponse } from 'next/server';
import { telegramAuth } from '@/lib/telegram/auth';

export async function POST() {
  try {
    const result = await telegramAuth.startAuth();
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error starting auth:', error);
    return NextResponse.json(
      { error: 'Failed to start authentication' },
      { status: 500 }
    );
  }
} 