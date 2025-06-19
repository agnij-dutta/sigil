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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const affiliation = searchParams.get('affiliation') as 'outside' | 'direct' | 'all' || undefined;
    const permission = searchParams.get('permission') as 'pull' | 'triage' | 'push' | 'maintain' | 'admin' || undefined;
    const per_page = parseInt(searchParams.get('per_page') || '30');
    const page = parseInt(searchParams.get('page') || '1');

    // Create GitHub data service instance
    const githubService = new GitHubDataService(decoded.github.accessToken);

    // Fetch collaborators
    const collaborators = await githubService.getCollaborators(resolvedParams.owner, resolvedParams.repo, {
      affiliation,
      permission,
      per_page,
      page,
    });

    return NextResponse.json(collaborators);
  } catch (error) {
    console.error('Error fetching collaborators:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collaborators' },
      { status: 500 }
    );
  }
} 