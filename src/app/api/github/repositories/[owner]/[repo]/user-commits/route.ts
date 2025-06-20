import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { GitHubDataService } from '@/lib/github/data';
import { AuthToken } from '@/types/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { owner: string; repo: string } }
) {
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
    ) as AuthToken;

    if (!decoded.github?.accessToken) {
      return NextResponse.json(
        { error: 'GitHub not connected' },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const username = decoded.github.user.login; // Use authenticated user's username
    const since = searchParams.get('since') || undefined;
    const until = searchParams.get('until') || undefined;
    const path = searchParams.get('path') || undefined;
    const per_page = parseInt(searchParams.get('per_page') || '30');
    const page = parseInt(searchParams.get('page') || '1');

    // Create GitHub data service instance
    const githubService = new GitHubDataService(decoded.github.accessToken);

    // First verify user has access and check collaboration status
    const [permission, isCollab] = await Promise.all([
      githubService.getRepositoryPermission(params.owner, params.repo),
      githubService.isCollaborator(params.owner, params.repo, username)
    ]);

    if (!permission || (permission.permission === 'none' && !isCollab)) {
      return NextResponse.json(
        { error: 'Access denied: You do not have access to this repository' },
        { status: 403 }
      );
    }

    // Fetch user's commits from the repository
    const commits = await githubService.getUserCommitsFromRepo(
      params.owner,
      params.repo,
      username,
      {
        since,
        until,
        path,
        per_page,
        page,
      }
    );

    return NextResponse.json({
      repository: `${params.owner}/${params.repo}`,
      user: username,
      commits,
      total: commits.length,
      permission: permission?.permission || 'collaborator',
      isCollaborator: isCollab,
    });
  } catch (error) {
    console.error('Error fetching user commits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user commits from repository' },
      { status: 500 }
    );
  }
} 