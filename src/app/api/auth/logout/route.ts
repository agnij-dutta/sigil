import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { AuthToken } from '@/types/auth';

export async function POST(request: NextRequest) {
  try {
    const { provider } = await request.json();
    
    // Get current auth data from cookie
    const authCookie = request.cookies.get('sigil_auth')?.value;
    let currentAuth: AuthToken = {};
    
    if (authCookie) {
      try {
        currentAuth = jwt.verify(
          authCookie,
          process.env.JWT_SECRET || 'fallback-secret'
        ) as AuthToken;
      } catch {
        // Invalid token, treat as no auth
      }
    }
    
    // If provider is specified, remove only that provider
    if (provider) {
      if (provider === 'github') {
        delete currentAuth.github;
      } else if (provider === 'telegram') {
        delete currentAuth.telegram;
      } else if (provider === 'civic') {
        delete currentAuth.civic;
      }
      
      // Clean up JWT metadata
      delete currentAuth.exp;
      delete currentAuth.iat;
      
      // If there's still auth data, create new token
      if (currentAuth.github || currentAuth.telegram || currentAuth.civic) {
        const newJwtToken = jwt.sign(
          currentAuth,
          process.env.JWT_SECRET || 'fallback-secret',
          { expiresIn: '7d' }
        );
        
        const response = NextResponse.json({ success: true, provider });
        response.cookies.set('sigil_auth', newJwtToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60, // 7 days
          path: '/',
        });
        
        return response;
      }
    }
    
    // If no provider specified or no auth data remaining, clear the cookie
    const response = NextResponse.json({ success: true, provider: provider || 'all' });
    response.cookies.delete('sigil_auth');
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
} 