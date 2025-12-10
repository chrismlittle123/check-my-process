import { Octokit } from "@octokit/rest";
import type { GitHubClientOptions, PullRequestData } from "./types.js";

export class GitHubClient {
  private octokit: Octokit;

  constructor(options: GitHubClientOptions) {
    this.octokit = new Octokit({
      auth: options.token,
      baseUrl: options.baseUrl,
    });
  }

  async getPullRequest(owner: string, repo: string, prNumber: number): Promise<PullRequestData> {
    const [prResponse, reviewsResponse] = await Promise.all([
      this.octokit.pulls.get({
        owner,
        repo,
        pull_number: prNumber,
      }),
      this.octokit.pulls.listReviews({
        owner,
        repo,
        pull_number: prNumber,
      }),
    ]);

    const pr = prResponse.data;
    const reviews = reviewsResponse.data;

    // Count unique approvals (only the latest review per user counts)
    const latestReviewsByUser = new Map<string, string>();
    for (const review of reviews) {
      if (review.user?.login && review.state) {
        latestReviewsByUser.set(review.user.login, review.state);
      }
    }

    const approvalCount = Array.from(latestReviewsByUser.values()).filter(
      (state) => state === "APPROVED"
    ).length;

    const reviewers = Array.from(latestReviewsByUser.keys());

    return {
      number: pr.number,
      title: pr.title,
      body: pr.body,
      branch: pr.head.ref,
      baseBranch: pr.base.ref,
      author: pr.user?.login ?? "unknown",
      filesChanged: pr.changed_files,
      additions: pr.additions,
      deletions: pr.deletions,
      approvalCount,
      reviewers,
    };
  }
}

export function createGitHubClient(options: GitHubClientOptions): GitHubClient {
  return new GitHubClient(options);
}
