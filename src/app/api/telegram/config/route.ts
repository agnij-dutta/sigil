import { NextResponse } from 'next/server';
import { telegramAuth } from '@/lib/telegram/auth';

export async function GET() {
  try {
    const config = telegramAuth.getBotConfig();
    
    return NextResponse.json(config);
  } catch (error) {
    console.error('Error getting bot config:', error);
    return NextResponse.json(
      { error: 'Failed to get bot configuration' },
      { status: 500 }
    );
  }
} 