import { NextRequest, NextResponse } from 'next/server';
import { githubAuth } from '@/lib/github/auth';

export async function GET(request: NextRequest) {
  try {
    // Generate a secure state parameter for CSRF protection
    const state = crypto.randomUUID();
    
    // Store state in session/cookie for verification later
    const response = NextResponse.redirect(githubAuth.getAuthorizationUrl(state));
    
    // Set state cookie with secure options
    response.cookies.set('github_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    });
    
    return response;
  } catch (error) {
    console.error('GitHub OAuth initiation error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate GitHub authentication' },
      { status: 500 }
    );
  }
} 