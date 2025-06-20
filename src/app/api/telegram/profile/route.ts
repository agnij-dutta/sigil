import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { AuthToken } from '@/types/auth';
import { telegramData } from '@/lib/telegram/data';

export async function GET(request: NextRequest) {
  try {
    // Get authentication from JWT cookie
    const authCookie = request.cookies.get('tipdao_auth')?.value;
    
    if (!authCookie) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    let authData: AuthToken;
    try {
      authData = jwt.verify(
        authCookie,
        process.env.JWT_SECRET || 'fallback-secret'
      ) as AuthToken;
    } catch {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    if (!authData.telegram?.sessionId) {
      return NextResponse.json(
        { error: 'Telegram not connected' },
        { status: 401 }
      );
    }

    const sessionString = authData.telegram.sessionId;

    const result = await telegramData.getUserProfile(sessionString);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: result.profile
    });
  } catch (error: any) {
    console.error('Error in telegram profile API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 