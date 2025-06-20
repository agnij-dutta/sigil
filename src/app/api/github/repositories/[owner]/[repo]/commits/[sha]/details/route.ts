import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { GitHubDataService } from '@/lib/github/data';
import { AuthToken } from '@/types/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ owner: string; repo: string; sha: string }> }
) {
  try {
    // Await the params since they're now a Promise
    const { owner, repo, sha } = await params;
    
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

    // Verify user has access to the repository
    const permission = await githubService.getRepositoryPermission(owner, repo);
    if (!permission || permission.permission === 'none') {
      return NextResponse.json(
        { error: 'Access denied: You do not have access to this repository' },
        { status: 403 }
      );
    }

    // Get detailed commit information
    const commitDetails = await githubService.getCommitDetails(
      owner,
      repo,
      sha
    );

    return NextResponse.json({
      repository: `${owner}/${repo}`,
      sha: sha,
      permission: permission.permission,
      ...commitDetails,
    });
  } catch (error) {
    console.error('Error fetching commit details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch commit details' },
      { status: 500 }
    );
  }
} 