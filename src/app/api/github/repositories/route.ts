import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { GitHubDataService } from '@/lib/github/data';
import { AuthToken } from '@/types/auth';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authCookie = request.cookies.get('tipdao_auth')?.value;
    if (!authCookie) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(
      authCookie,
      process.env.JWT_SECRET || 'fallback-secret'
    ) as AuthToken;

    if (!decoded.github?.accessToken) {
      return NextResponse.json(
        { error: 'GitHub not connected' },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') as 'all' | 'owner' | 'public' | 'private' | 'member' || 'all';
    const sort = searchParams.get('sort') as 'created' | 'updated' | 'pushed' | 'full_name' || 'updated';
    const direction = searchParams.get('direction') as 'asc' | 'desc' || 'desc';
    const per_page = parseInt(searchParams.get('per_page') || '30');
    const page = parseInt(searchParams.get('page') || '1');

    // Create GitHub data service instance
    const githubService = new GitHubDataService(decoded.github.accessToken);

    // Fetch repositories
    const repositories = await githubService.getRepositories({
      type,
      sort,
      direction,
      per_page,
      page,
    });

    return NextResponse.json(repositories);
  } catch (error) {
    console.error('Error fetching repositories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch repositories' },
      { status: 500 }
    );
  }
} 