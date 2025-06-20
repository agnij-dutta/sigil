import { NextRequest, NextResponse } from 'next/server';
import { githubAuth } from '@/lib/github/auth';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    
    // Check for OAuth errors
    if (error) {
      console.error('GitHub OAuth error:', error);
      return NextResponse.redirect(
        new URL(`/dashboard?error=${encodeURIComponent(error)}`, request.url)
      );
    }
    
    // Validate required parameters
    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/dashboard?error=missing_parameters', request.url)
      );
    }
    
    // Verify state parameter for CSRF protection
    const savedState = request.cookies.get('github_oauth_state')?.value;
    if (!savedState || savedState !== state) {
      return NextResponse.redirect(
        new URL('/dashboard?error=invalid_state', request.url)
      );
    }
    
    // Exchange code for access token
    const accessToken = await githubAuth.exchangeCodeForToken(code, state);
    
    // Get user information
    const user = await githubAuth.getAuthenticatedUser(accessToken);
    
    // Create JWT token with user data and access token
    const jwtToken = jwt.sign(
      {
        github: {
          user: user,
          accessToken: accessToken,
          authenticatedAt: new Date().toISOString(),
        },
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );
    
    // Create response to redirect to dashboard
    const response = NextResponse.redirect(
      new URL('/dashboard?github_connected=true', request.url)
    );
    
    // Set authentication cookie
    response.cookies.set('sigil_auth', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });
    
    // Clear the state cookie
    response.cookies.delete('github_oauth_state');
    
    return response;
  } catch (error) {
    console.error('GitHub OAuth callback error:', error);
    return NextResponse.redirect(
      new URL(`/dashboard?error=${encodeURIComponent('authentication_failed')}`, request.url)
    );
  }
} 