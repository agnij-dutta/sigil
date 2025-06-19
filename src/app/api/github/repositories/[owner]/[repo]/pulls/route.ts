import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { GitHubDataService } from '@/lib/github/data';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ owner: string; repo: string }> }
) {
  const resolvedParams = await params;
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
    ) as { github?: { accessToken: string } };

    if (!decoded.github?.accessToken) {
      return NextResponse.json(
        { error: 'GitHub not connected' },
        { status: 401 }
      );
    }

    const { owner, repo } = resolvedParams;

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const state = searchParams.get('state') as 'open' | 'closed' | 'all' || 'all';
    const head = searchParams.get('head') || undefined;
    const base = searchParams.get('base') || undefined;
    const sort = searchParams.get('sort') as 'created' | 'updated' | 'popularity' | 'long-running' || 'updated';
    const direction = searchParams.get('direction') as 'asc' | 'desc' || 'desc';
    const per_page = parseInt(searchParams.get('per_page') || '30');
    const page = parseInt(searchParams.get('page') || '1');

    // Create GitHub data service instance
    const githubService = new GitHubDataService(decoded.github.accessToken);

    // Fetch pull requests
    const pullRequests = await githubService.getPullRequests(owner, repo, {
      state,
      head,
      base,
      sort,
      direction,
      per_page,
      page,
    });

    return NextResponse.json(pullRequests);
  } catch (error) {
    console.error('Error fetching pull requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pull requests' },
      { status: 500 }
    );
  }
} 