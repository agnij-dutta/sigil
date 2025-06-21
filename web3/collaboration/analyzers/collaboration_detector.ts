export interface CollaborationPattern {
  type: 'pair_programming' | 'code_review' | 'mentoring' | 'team_lead' | 'cross_functional';
  confidence: number; // 0-1
  evidence: string[];
  collaborators: string[];
  timeframe: {
    start: Date;
    end: Date;
  };
}

export interface CollaborationMetrics {
  totalCollaborators: number;
  uniqueCollaborators: number;
  collaborationIntensity: number; // commits with multiple authors / total commits
  responseTimeAverage: number; // average time to respond to PRs/issues
  codeReviewParticipation: number; // percentage of PRs reviewed
  crossTeamCollaboration: number; // collaboration outside immediate team
  mentorshipIndicators: number;
  leadershipIndicators: number;
}

export class CollaborationDetector {
  
  async detectCollaborationPatterns(
    commits: any[],
    pullRequests: any[],
    issues: any[],
    userLogin: string
  ): Promise<CollaborationPattern[]> {
    const patterns: CollaborationPattern[] = [];

    // Detect pair programming
    const pairProgramming = await this.detectPairProgramming(commits, userLogin);
    if (pairProgramming.length > 0) {
      patterns.push(...pairProgramming);
    }

    // Detect code review patterns
    const codeReview = await this.detectCodeReviewPatterns(pullRequests, userLogin);
    if (codeReview.length > 0) {
      patterns.push(...codeReview);
    }

    // Detect mentoring patterns
    const mentoring = await this.detectMentoringPatterns(commits, pullRequests, issues, userLogin);
    if (mentoring.length > 0) {
      patterns.push(...mentoring);
    }

    // Detect leadership patterns
    const leadership = await this.detectLeadershipPatterns(pullRequests, issues, userLogin);
    if (leadership.length > 0) {
      patterns.push(...leadership);
    }

    return patterns;
  }

  private async detectPairProgramming(commits: any[], userLogin: string): Promise<CollaborationPattern[]> {
    const patterns: CollaborationPattern[] = [];
    const pairCommits = commits.filter(commit => {
      const message = commit.commit?.message || '';
      const hasCoAuthor = /co-authored-by:/i.test(message);
      const hasPairKeywords = /pair:|paired with|with @|mob:|mobbed/i.test(message);
      
      return hasCoAuthor || hasPairKeywords;
    });

    if (pairCommits.length > 0) {
      const collaborators = this.extractCollaboratorsFromCommits(pairCommits);
      const confidence = Math.min(pairCommits.length / commits.length * 2, 1);

      patterns.push({
        type: 'pair_programming',
        confidence,
        evidence: [
          `${pairCommits.length} commits with pair programming indicators`,
          'Co-authored-by tags found in commit messages',
          'Pair programming keywords detected'
        ],
        collaborators: collaborators.filter(c => c !== userLogin),
        timeframe: {
          start: new Date(Math.min(...pairCommits.map(c => new Date(c.commit?.author?.date || c.date).getTime()))),
          end: new Date(Math.max(...pairCommits.map(c => new Date(c.commit?.author?.date || c.date).getTime())))
        }
      });
    }

    return patterns;
  }

  private async detectCodeReviewPatterns(pullRequests: any[], userLogin: string): Promise<CollaborationPattern[]> {
    const patterns: CollaborationPattern[] = [];
    
    // Find PRs where user was reviewer
    const reviewedPRs = pullRequests.filter(pr => 
      pr.reviews?.some((review: any) => review.user?.login === userLogin)
    );

    // Find PRs where user's code was reviewed
    const userPRs = pullRequests.filter(pr => pr.user?.login === userLogin);

    if (reviewedPRs.length > 0 || userPRs.length > 0) {
      const totalReviews = reviewedPRs.length;
      const reviewParticipation = totalReviews / pullRequests.length;
      const confidence = Math.min(reviewParticipation * 2, 1);

      const allReviewers = new Set<string>();
      userPRs.forEach(pr => {
        pr.reviews?.forEach((review: any) => {
          if (review.user?.login !== userLogin) {
            allReviewers.add(review.user?.login);
          }
        });
      });

      patterns.push({
        type: 'code_review',
        confidence,
        evidence: [
          `Reviewed ${totalReviews} pull requests`,
          `${userPRs.length} PRs submitted for review`,
          `${reviewParticipation * 100}% review participation rate`
        ],
        collaborators: Array.from(allReviewers),
        timeframe: {
          start: new Date(Math.min(...pullRequests.map(pr => new Date(pr.created_at).getTime()))),
          end: new Date(Math.max(...pullRequests.map(pr => new Date(pr.updated_at || pr.created_at).getTime())))
        }
      });
    }

    return patterns;
  }

  private async detectMentoringPatterns(
    commits: any[],
    pullRequests: any[],
    issues: any[],
    userLogin: string
  ): Promise<CollaborationPattern[]> {
    const patterns: CollaborationPattern[] = [];
    
    // Look for mentoring indicators
    const mentoringIndicators = [
      // Comments that indicate teaching/helping
      ...pullRequests.filter(pr => 
        pr.comments?.some((comment: any) => 
          comment.user?.login === userLogin && 
          this.isMentoringComment(comment.body)
        )
      ),
      
      // Issues where user helps others
      ...issues.filter(issue =>
        issue.comments?.some((comment: any) =>
          comment.user?.login === userLogin &&
          this.isHelpfulComment(comment.body)
        )
      )
    ];

    if (mentoringIndicators.length > 0) {
      const confidence = Math.min(mentoringIndicators.length / (pullRequests.length + issues.length), 1);
      
      const mentees = new Set<string>();
      mentoringIndicators.forEach(item => {
        if (item.user?.login !== userLogin) {
          mentees.add(item.user?.login);
        }
      });

      patterns.push({
        type: 'mentoring',
        confidence,
        evidence: [
          `${mentoringIndicators.length} mentoring interactions found`,
          'Teaching/helpful comments in PRs and issues',
          'Knowledge sharing patterns detected'
        ],
        collaborators: Array.from(mentees),
        timeframe: {
          start: new Date(Math.min(...mentoringIndicators.map(item => new Date(item.created_at).getTime()))),
          end: new Date(Math.max(...mentoringIndicators.map(item => new Date(item.updated_at || item.created_at).getTime())))
        }
      });
    }

    return patterns;
  }

  private async detectLeadershipPatterns(
    pullRequests: any[],
    issues: any[],
    userLogin: string
  ): Promise<CollaborationPattern[]> {
    const patterns: CollaborationPattern[] = [];
    
    // Leadership indicators
    const userCreatedPRs = pullRequests.filter(pr => pr.user?.login === userLogin);
    const userCreatedIssues = issues.filter(issue => issue.user?.login === userLogin);
    const userAssignedIssues = issues.filter(issue => 
      issue.assignees?.some((assignee: any) => assignee.login === userLogin)
    );

    const leadershipScore = (
      userCreatedPRs.length * 0.3 +
      userCreatedIssues.length * 0.2 +
      userAssignedIssues.length * 0.5
    ) / (pullRequests.length + issues.length);

    if (leadershipScore > 0.1) { // Threshold for leadership
      const confidence = Math.min(leadershipScore * 3, 1);
      
      const collaborators = new Set<string>();
      userCreatedPRs.forEach(pr => {
        pr.reviews?.forEach((review: any) => {
          if (review.user?.login !== userLogin) {
            collaborators.add(review.user?.login);
          }
        });
      });

      patterns.push({
        type: 'team_lead',
        confidence,
        evidence: [
          `Created ${userCreatedPRs.length} pull requests`,
          `Created ${userCreatedIssues.length} issues`,
          `Assigned to ${userAssignedIssues.length} issues`,
          `Leadership score: ${(leadershipScore * 100).toFixed(1)}%`
        ],
        collaborators: Array.from(collaborators),
        timeframe: {
          start: new Date(Math.min(
            ...userCreatedPRs.map(pr => new Date(pr.created_at).getTime()),
            ...userCreatedIssues.map(issue => new Date(issue.created_at).getTime())
          )),
          end: new Date(Math.max(
            ...userCreatedPRs.map(pr => new Date(pr.updated_at || pr.created_at).getTime()),
            ...userCreatedIssues.map(issue => new Date(issue.updated_at || issue.created_at).getTime())
          ))
        }
      });
    }

    return patterns;
  }

  async calculateCollaborationMetrics(
    commits: any[],
    pullRequests: any[],
    issues: any[],
    userLogin: string
  ): Promise<CollaborationMetrics> {
    const allCollaborators = new Set<string>();
    
    // Extract collaborators from commits
    commits.forEach(commit => {
      if (commit.author?.login && commit.author.login !== userLogin) {
        allCollaborators.add(commit.author.login);
      }
      if (commit.committer?.login && commit.committer.login !== userLogin) {
        allCollaborators.add(commit.committer.login);
      }
    });

    // Extract collaborators from PRs
    pullRequests.forEach(pr => {
      if (pr.user?.login && pr.user.login !== userLogin) {
        allCollaborators.add(pr.user.login);
      }
      pr.reviews?.forEach((review: any) => {
        if (review.user?.login && review.user.login !== userLogin) {
          allCollaborators.add(review.user.login);
        }
      });
    });

    const collaborativeCommits = commits.filter(commit => 
      this.isCollaborativeCommit(commit)
    );

    const collaborationIntensity = commits.length > 0 ? 
      collaborativeCommits.length / commits.length : 0;

    const userPRs = pullRequests.filter(pr => pr.user?.login === userLogin);
    const reviewedPRs = pullRequests.filter(pr => 
      pr.reviews?.some((review: any) => review.user?.login === userLogin)
    );

    const codeReviewParticipation = pullRequests.length > 0 ? 
      reviewedPRs.length / pullRequests.length : 0;

    // Calculate average response time (simplified)
    const responseTimes = userPRs.map(pr => {
      const firstReview = pr.reviews?.[0];
      if (firstReview) {
        const prTime = new Date(pr.created_at).getTime();
        const reviewTime = new Date(firstReview.submitted_at).getTime();
        return (reviewTime - prTime) / (1000 * 60 * 60); // hours
      }
      return 0;
    }).filter(time => time > 0);

    const responseTimeAverage = responseTimes.length > 0 ? 
      responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length : 0;

    return {
      totalCollaborators: allCollaborators.size,
      uniqueCollaborators: allCollaborators.size,
      collaborationIntensity,
      responseTimeAverage,
      codeReviewParticipation,
      crossTeamCollaboration: this.calculateCrossTeamCollaboration(allCollaborators),
      mentorshipIndicators: this.countMentorshipIndicators(pullRequests, issues, userLogin),
      leadershipIndicators: this.countLeadershipIndicators(pullRequests, issues, userLogin)
    };
  }

  private extractCollaboratorsFromCommits(commits: any[]): string[] {
    const collaborators = new Set<string>();
    
    commits.forEach(commit => {
      const message = commit.commit?.message || '';
      const coAuthorMatches = message.match(/co-authored-by:\s*([^<]+)/gi);
      
      if (coAuthorMatches) {
        coAuthorMatches.forEach(match => {
          const name = match.replace(/co-authored-by:\s*/i, '').trim();
          collaborators.add(name);
        });
      }
    });

    return Array.from(collaborators);
  }

  private isCollaborativeCommit(commit: any): boolean {
    const message = commit.commit?.message || '';
    return /co-authored-by:|pair:|paired with|with @|mob:/i.test(message);
  }

  private isMentoringComment(commentBody: string): boolean {
    const mentoringKeywords = [
      'let me explain', 'here\'s how', 'try this approach', 'consider',
      'suggestion:', 'tip:', 'you might want to', 'best practice',
      'documentation:', 'example:', 'tutorial', 'guide'
    ];
    
    return mentoringKeywords.some(keyword => 
      commentBody.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  private isHelpfulComment(commentBody: string): boolean {
    const helpfulKeywords = [
      'solution:', 'fix:', 'resolved', 'workaround',
      'answer:', 'explanation:', 'clarification'
    ];
    
    return helpfulKeywords.some(keyword => 
      commentBody.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  private calculateCrossTeamCollaboration(collaborators: Set<string>): number {
    // Simplified - in real implementation, would analyze team membership
    return Math.min(collaborators.size / 10, 1);
  }

  private countMentorshipIndicators(pullRequests: any[], issues: any[], userLogin: string): number {
    let count = 0;
    
    pullRequests.forEach(pr => {
      pr.comments?.forEach((comment: any) => {
        if (comment.user?.login === userLogin && this.isMentoringComment(comment.body)) {
          count++;
        }
      });
    });

    issues.forEach(issue => {
      issue.comments?.forEach((comment: any) => {
        if (comment.user?.login === userLogin && this.isHelpfulComment(comment.body)) {
          count++;
        }
      });
    });

    return count;
  }

  private countLeadershipIndicators(pullRequests: any[], issues: any[], userLogin: string): number {
    const userCreatedPRs = pullRequests.filter(pr => pr.user?.login === userLogin).length;
    const userCreatedIssues = issues.filter(issue => issue.user?.login === userLogin).length;
    const userAssignedIssues = issues.filter(issue => 
      issue.assignees?.some((assignee: any) => assignee.login === userLogin)
    ).length;

    return userCreatedPRs + userCreatedIssues + (userAssignedIssues * 2);
  }
} 