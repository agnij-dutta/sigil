import { NextRequest, NextResponse } from 'next/server';
import { telegramAuth } from '@/lib/telegram/auth';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, code } = await request.json();
    
    if (!sessionId || !code) {
      return NextResponse.json(
        { error: 'Session ID and verification code are required' },
        { status: 400 }
      );
    }

    // Verify the auth code
    const isValid = telegramAuth.verifyPhoneAuthCode(sessionId, code);
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      );
    }

    // Get the authenticated session
    const session = telegramAuth.getSessionStatus(sessionId);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication session not found' },
        { status: 404 }
      );
    }

    // Create JWT token for authenticated user
    const token = jwt.sign(
      {
        telegram: {
          user: session.user,
          authenticatedAt: session.authenticated_at,
          sessionId: sessionId
        }
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    // Set HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      user: session.user,
      message: 'Phone verification successful'
    });

    response.cookies.set('tipdao_auth', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return response;
  } catch (error) {
    console.error('Telegram phone verification error:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
} 