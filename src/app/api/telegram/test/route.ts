import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check if environment variables are set
    const telegramConfig = {
      apiId: process.env.TELEGRAM_API_ID ? 'Set' : 'Missing',
      apiHash: process.env.TELEGRAM_API_HASH ? 'Set' : 'Missing',
      botToken: process.env.TELEGRAM_BOT_TOKEN ? 'Set' : 'Missing',
      webhookUrl: process.env.TELEGRAM_WEBHOOK_URL ? 'Set' : 'Missing',
    };

    return NextResponse.json({
      success: true,
      message: 'Telegram integration test endpoint',
      config: telegramConfig,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Telegram test error:', error);
    return NextResponse.json(
      { 
        error: 'Test failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 