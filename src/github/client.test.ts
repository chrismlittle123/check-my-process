import { describe, it, expect, vi, beforeEach } from "vitest";
import { GitHubClient, createGitHubClient } from "./client.js";

// Create mock functions
const mockGet = vi.fn();
const mockListReviews = vi.fn();

// Mock the entire @octokit/rest module
vi.mock("@octokit/rest", () => {
  return {
    Octokit: vi.fn().mockImplementation(function () {
      return {
        pulls: {
          get: mockGet,
          listReviews: mockListReviews,
        },
      };
    }),
  };
});

import { Octokit } from "@octokit/rest";

describe("GitHubClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createGitHubClient", () => {
    it("should create a GitHubClient instance", () => {
      const client = createGitHubClient({ token: "test-token" });

      expect(client).toBeInstanceOf(GitHubClient);
    });

    it("should pass token to Octokit", () => {
      createGitHubClient({ token: "test-token" });

      expect(Octokit).toHaveBeenCalledWith({
        auth: "test-token",
        baseUrl: undefined,
      });
    });

    it("should pass baseUrl to Octokit when provided", () => {
      createGitHubClient({
        token: "test-token",
        baseUrl: "https://github.example.com/api/v3",
      });

      expect(Octokit).toHaveBeenCalledWith({
        auth: "test-token",
        baseUrl: "https://github.example.com/api/v3",
      });
    });
  });

  describe("getPullRequest", () => {
    it("should fetch PR data and reviews", async () => {
      mockGet.mockResolvedValue({
        data: {
          number: 123,
          title: "Test PR",
          body: "PR body",
          head: { ref: "feature/test" },
          base: { ref: "main" },
          user: { login: "testuser" },
          changed_files: 5,
          additions: 100,
          deletions: 50,
        },
      });

      mockListReviews.mockResolvedValue({
        data: [
          { user: { login: "reviewer1" }, state: "APPROVED" },
          { user: { login: "reviewer2" }, state: "CHANGES_REQUESTED" },
        ],
      });

      const client = createGitHubClient({ token: "test-token" });
      const pr = await client.getPullRequest("owner", "repo", 123);

      expect(pr).toEqual({
        number: 123,
        title: "Test PR",
        body: "PR body",
        branch: "feature/test",
        baseBranch: "main",
        author: "testuser",
        filesChanged: 5,
        additions: 100,
        deletions: 50,
        approvalCount: 1,
        reviewers: ["reviewer1", "reviewer2"],
      });
    });

    it("should count only the latest review per user", async () => {
      mockGet.mockResolvedValue({
        data: {
          number: 123,
          title: "Test PR",
          body: "PR body",
          head: { ref: "feature/test" },
          base: { ref: "main" },
          user: { login: "testuser" },
          changed_files: 5,
          additions: 100,
          deletions: 50,
        },
      });

      mockListReviews.mockResolvedValue({
        data: [
          { user: { login: "reviewer1" }, state: "CHANGES_REQUESTED" },
          { user: { login: "reviewer1" }, state: "APPROVED" }, // Later approval
          { user: { login: "reviewer2" }, state: "APPROVED" },
          { user: { login: "reviewer2" }, state: "CHANGES_REQUESTED" }, // Later rejection
        ],
      });

      const client = createGitHubClient({ token: "test-token" });
      const pr = await client.getPullRequest("owner", "repo", 123);

      // reviewer1's latest is APPROVED, reviewer2's latest is CHANGES_REQUESTED
      expect(pr.approvalCount).toBe(1);
    });

    it("should handle PR with no reviews", async () => {
      mockGet.mockResolvedValue({
        data: {
          number: 123,
          title: "Test PR",
          body: "PR body",
          head: { ref: "feature/test" },
          base: { ref: "main" },
          user: { login: "testuser" },
          changed_files: 5,
          additions: 100,
          deletions: 50,
        },
      });

      mockListReviews.mockResolvedValue({
        data: [],
      });

      const client = createGitHubClient({ token: "test-token" });
      const pr = await client.getPullRequest("owner", "repo", 123);

      expect(pr.approvalCount).toBe(0);
      expect(pr.reviewers).toEqual([]);
    });

    it("should handle null user in PR", async () => {
      mockGet.mockResolvedValue({
        data: {
          number: 123,
          title: "Test PR",
          body: null,
          head: { ref: "feature/test" },
          base: { ref: "main" },
          user: null,
          changed_files: 5,
          additions: 100,
          deletions: 50,
        },
      });

      mockListReviews.mockResolvedValue({
        data: [],
      });

      const client = createGitHubClient({ token: "test-token" });
      const pr = await client.getPullRequest("owner", "repo", 123);

      expect(pr.author).toBe("unknown");
      expect(pr.body).toBeNull();
    });

    it("should call Octokit with correct parameters", async () => {
      mockGet.mockResolvedValue({
        data: {
          number: 456,
          title: "Test",
          body: "",
          head: { ref: "test" },
          base: { ref: "main" },
          user: { login: "user" },
          changed_files: 1,
          additions: 1,
          deletions: 0,
        },
      });
      mockListReviews.mockResolvedValue({ data: [] });

      const client = createGitHubClient({ token: "test-token" });
      await client.getPullRequest("myowner", "myrepo", 456);

      expect(mockGet).toHaveBeenCalledWith({
        owner: "myowner",
        repo: "myrepo",
        pull_number: 456,
      });

      expect(mockListReviews).toHaveBeenCalledWith({
        owner: "myowner",
        repo: "myrepo",
        pull_number: 456,
      });
    });

    it("should handle reviews with null user", async () => {
      mockGet.mockResolvedValue({
        data: {
          number: 123,
          title: "Test PR",
          body: "PR body",
          head: { ref: "feature/test" },
          base: { ref: "main" },
          user: { login: "testuser" },
          changed_files: 5,
          additions: 100,
          deletions: 50,
        },
      });

      mockListReviews.mockResolvedValue({
        data: [
          { user: null, state: "APPROVED" },
          { user: { login: "reviewer1" }, state: "APPROVED" },
        ],
      });

      const client = createGitHubClient({ token: "test-token" });
      const pr = await client.getPullRequest("owner", "repo", 123);

      // Only reviewer1 should count (null user is ignored)
      expect(pr.approvalCount).toBe(1);
      expect(pr.reviewers).toEqual(["reviewer1"]);
    });
  });

  describe("API error handling", () => {
    it("should throw error for 404 Not Found (non-existent PR)", async () => {
      const error = new Error("Not Found") as Error & { status: number };
      error.status = 404;
      mockGet.mockRejectedValue(error);

      const client = createGitHubClient({ token: "test-token" });

      await expect(client.getPullRequest("owner", "repo", 99999)).rejects.toThrow("Not Found");
    });

    it("should throw error for 401 Unauthorized (bad token)", async () => {
      const error = new Error("Bad credentials") as Error & { status: number };
      error.status = 401;
      mockGet.mockRejectedValue(error);

      const client = createGitHubClient({ token: "invalid-token" });

      await expect(client.getPullRequest("owner", "repo", 1)).rejects.toThrow("Bad credentials");
    });

    it("should throw error for 403 Forbidden (no access)", async () => {
      const error = new Error("Resource not accessible") as Error & { status: number };
      error.status = 403;
      mockGet.mockRejectedValue(error);

      const client = createGitHubClient({ token: "test-token" });

      await expect(client.getPullRequest("owner", "private-repo", 1)).rejects.toThrow(
        "Resource not accessible"
      );
    });

    it("should throw error for 403 rate limit exceeded", async () => {
      const error = new Error("API rate limit exceeded") as Error & { status: number };
      error.status = 403;
      mockGet.mockRejectedValue(error);

      const client = createGitHubClient({ token: "test-token" });

      await expect(client.getPullRequest("owner", "repo", 1)).rejects.toThrow(
        "API rate limit exceeded"
      );
    });

    it("should throw error for network failures", async () => {
      const error = new Error("getaddrinfo ENOTFOUND api.github.com");
      mockGet.mockRejectedValue(error);

      const client = createGitHubClient({ token: "test-token" });

      await expect(client.getPullRequest("owner", "repo", 1)).rejects.toThrow("ENOTFOUND");
    });

    it("should throw error for 500 Internal Server Error", async () => {
      const error = new Error("Internal Server Error") as Error & { status: number };
      error.status = 500;
      mockGet.mockRejectedValue(error);

      const client = createGitHubClient({ token: "test-token" });

      await expect(client.getPullRequest("owner", "repo", 1)).rejects.toThrow(
        "Internal Server Error"
      );
    });

    it("should throw error for 502 Bad Gateway", async () => {
      const error = new Error("Bad Gateway") as Error & { status: number };
      error.status = 502;
      mockGet.mockRejectedValue(error);

      const client = createGitHubClient({ token: "test-token" });

      await expect(client.getPullRequest("owner", "repo", 1)).rejects.toThrow("Bad Gateway");
    });

    it("should throw error for 503 Service Unavailable", async () => {
      const error = new Error("Service Unavailable") as Error & { status: number };
      error.status = 503;
      mockGet.mockRejectedValue(error);

      const client = createGitHubClient({ token: "test-token" });

      await expect(client.getPullRequest("owner", "repo", 1)).rejects.toThrow(
        "Service Unavailable"
      );
    });

    it("should throw error when PR fetch succeeds but reviews fetch fails", async () => {
      mockGet.mockResolvedValue({
        data: {
          number: 123,
          title: "Test PR",
          body: "PR body",
          head: { ref: "feature/test" },
          base: { ref: "main" },
          user: { login: "testuser" },
          changed_files: 5,
          additions: 100,
          deletions: 50,
        },
      });

      const error = new Error("Failed to fetch reviews") as Error & { status: number };
      error.status = 500;
      mockListReviews.mockRejectedValue(error);

      const client = createGitHubClient({ token: "test-token" });

      await expect(client.getPullRequest("owner", "repo", 123)).rejects.toThrow(
        "Failed to fetch reviews"
      );
    });

    it("should throw error for timeout", async () => {
      const error = new Error("Request timeout");
      error.name = "TimeoutError";
      mockGet.mockRejectedValue(error);

      const client = createGitHubClient({ token: "test-token" });

      await expect(client.getPullRequest("owner", "repo", 1)).rejects.toThrow("Request timeout");
    });
  });
});
