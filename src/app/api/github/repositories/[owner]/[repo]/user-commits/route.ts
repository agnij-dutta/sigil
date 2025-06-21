import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { GitHubDataService } from '@/lib/github/data';
import { AuthToken } from '@/types/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ owner: string; repo: string }> }
) {
  try {
    // Await the params since they're now a Promise
    const { owner, repo } = await params;
    
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

    // Create GitHub data service instance
    const githubService = new GitHubDataService(decoded.github.accessToken);

    // Get the username (authenticated user)
    const username = decoded.github.user.login;

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const per_page = parseInt(searchParams.get('per_page') || '30');
    const sha = searchParams.get('sha') || undefined;
    const path = searchParams.get('path') || undefined;
    const since = searchParams.get('since') || undefined;
    const until = searchParams.get('until') || undefined;

    // Verify user has access to the repository and is a collaborator
    const [permission, isCollaborator] = await Promise.all([
      githubService.getRepositoryPermission(owner, repo),
      githubService.isCollaborator(owner, repo, username)
    ]);

    if (!permission || permission.permission === 'none') {
      return NextResponse.json(
        { error: 'Access denied: You do not have access to this repository' },
        { status: 403 }
      );
    }

    // Get user's commits from the repository
    const commits = await githubService.getUserCommitsFromRepo(
      owner,
      repo,
      username,
      {
        sha,
        path,
        since,
        until,
        per_page,
        page
      }
    );

    return NextResponse.json({
      repository: `${owner}/${repo}`,
      username,
      isCollaborator,
      permission: permission.permission,
      commits,
      pagination: {
        page,
        per_page,
        total: commits.length
      }
    });
  } catch (error) {
    console.error('Error fetching user commits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user commits' },
      { status: 500 }
    );
  }
} 