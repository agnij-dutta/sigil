import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { GitHubDataService } from '@/lib/github/data';
import { AuthToken } from '@/types/auth';

export async function GET(request: NextRequest) {
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
    const affiliation = searchParams.get('affiliation') as 'owner' | 'collaborator' | 'organization_member' || 'collaborator';
    const sort = searchParams.get('sort') as 'created' | 'updated' | 'pushed' | 'full_name' || 'updated';
    const direction = searchParams.get('direction') as 'asc' | 'desc' || 'desc';
    const per_page = parseInt(searchParams.get('per_page') || '30');
    const page = parseInt(searchParams.get('page') || '1');

    // Create GitHub data service instance
    const githubService = new GitHubDataService(decoded.github.accessToken);

    // Fetch collaborative repositories (private repos where user is a collaborator)
    const repositories = await githubService.getCollaborativeRepositories({
      affiliation,
      sort,
      direction,
      per_page,
      page,
    });

    return NextResponse.json({
      repositories,
      total: repositories.length,
      message: `Found ${repositories.length} private repositories where you are a collaborator`
    });
  } catch (error) {
    console.error('Error fetching collaborative repositories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collaborative repositories' },
      { status: 500 }
    );
  }
} 