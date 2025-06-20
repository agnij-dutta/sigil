import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { AuthToken } from '@/types/auth';
import { telegramAuth } from '@/lib/telegram/auth';

export async function POST(request: NextRequest) {
  try {
    const { sessionString } = await request.json();

    if (!sessionString) {
      return NextResponse.json(
        { error: 'Session string is required' },
        { status: 400 }
      );
    }

    // Validate the session and get user info
    const validation = await telegramAuth.validateSession(sessionString);
    
    if (!validation.valid || !validation.user) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Get current auth data from cookie to merge with Telegram auth
    const authCookie = request.cookies.get('tipdao_auth')?.value;
    let currentAuth: AuthToken = {};
    
    if (authCookie) {
      try {
        currentAuth = jwt.verify(
          authCookie,
          process.env.JWT_SECRET || 'fallback-secret'
        ) as AuthToken;
        
        // Clean up JWT metadata
        delete currentAuth.exp;
        delete currentAuth.iat;
      } catch {
        // Invalid token, start fresh
        currentAuth = {};
      }
    }

    // Add Telegram auth data
    currentAuth.telegram = {
      user: {
        id: validation.user.id,
        first_name: validation.user.first_name,
        last_name: validation.user.last_name,
        username: validation.user.username,
        phone_number: validation.user.phone_number,
        auth_date: Math.floor(Date.now() / 1000),
        hash: sessionString.substring(0, 32), // Use part of session as hash
      },
      authenticatedAt: new Date().toISOString(),
      sessionId: sessionString,
    };

    // Create new JWT token with merged auth data
    const jwtToken = jwt.sign(
      currentAuth,
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    // Create response
    const response = NextResponse.json({
      valid: true,
      user: validation.user,
      sessionId: sessionString
    });

    // Set authentication cookie
    response.cookies.set('tipdao_auth', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Session validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate session' },
      { status: 500 }
    );
  }
} 