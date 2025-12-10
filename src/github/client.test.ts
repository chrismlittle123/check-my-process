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
});
