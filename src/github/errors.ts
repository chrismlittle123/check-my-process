export class GitHubAuthError extends Error {
  constructor(message: string = "GitHub authentication failed") {
    super(message);
    this.name = "GitHubAuthError";
  }
}

export class GitHubNotFoundError extends Error {
  constructor(resource: string) {
    super(`${resource} not found`);
    this.name = "GitHubNotFoundError";
  }
}

export class GitHubRateLimitError extends Error {
  resetAt: Date;

  constructor(resetAt: Date) {
    const resetTime = resetAt.toLocaleTimeString();
    super(`GitHub API rate limit exceeded. Resets at ${resetTime}`);
    this.name = "GitHubRateLimitError";
    this.resetAt = resetAt;
  }
}
