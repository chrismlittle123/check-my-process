export interface PullRequestData {
  number: number;
  title: string;
  body: string | null;
  branch: string;
  baseBranch: string;
  author: string;
  filesChanged: number;
  additions: number;
  deletions: number;
  approvalCount: number;
  reviewers: string[];
}

export interface GitHubClientOptions {
  token: string;
  baseUrl?: string;
}
