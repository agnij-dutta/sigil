import { NextRequest, NextResponse } from 'next/server';
import { telegramAuth } from '@/lib/telegram/auth';

export async function POST() {
  try {
    // Generate a unique session ID
    const sessionId = telegramAuth.generateSessionId();
    
    // Generate QR code
    const qrCode = await telegramAuth.generateQRCode(sessionId);
    
    return NextResponse.json({
      success: true,
      sessionId,
      qrCode,
      expiresIn: 3600, // 1 hour
    });
  } catch (error) {
    console.error('Telegram QR generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }
    
    // Check session status
    const session = telegramAuth.getSessionStatus(sessionId);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found or expired' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      sessionId,
      status: session.status,
      user: session.data?.user || null,
    });
  } catch (error) {
    console.error('Telegram session check error:', error);
    return NextResponse.json(
      { error: 'Failed to check session status' },
      { status: 500 }
    );
  }
} 