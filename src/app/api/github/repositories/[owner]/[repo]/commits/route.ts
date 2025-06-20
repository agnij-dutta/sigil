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
    const authCookie = request.cookies.get('sigil_auth')?.value;
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const sha = searchParams.get('sha') || undefined;
    const path = searchParams.get('path') || undefined;
    const author = searchParams.get('author') || undefined;
    const since = searchParams.get('since') || undefined;
    const until = searchParams.get('until') || undefined;
    const per_page = parseInt(searchParams.get('per_page') || '30');
    const page = parseInt(searchParams.get('page') || '1');

    // Create GitHub data service instance
    const githubService = new GitHubDataService(decoded.github.accessToken);

    // Fetch commits
    const commits = await githubService.getCommits(resolvedParams.owner, resolvedParams.repo, {
      sha,
      path,
      author,
      since,
      until,
      per_page,
      page,
    });

    return NextResponse.json(commits);
  } catch (error) {
    console.error('Error fetching commits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch commits' },
      { status: 500 }
    );
  }
} 