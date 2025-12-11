import { describe, it, expect } from "vitest";
import { checkTicketReference } from "./ticket.js";
import type { CheckContext } from "./types.js";
import type { PullRequestData } from "../github/types.js";
import type { Config } from "../config/schema.js";

function createMockPr(overrides: Partial<PullRequestData> = {}): PullRequestData {
  return {
    number: 1,
    title: "Test PR",
    body: "Test body",
    branch: "feature/test",
    baseBranch: "main",
    author: "testuser",
    filesChanged: 5,
    additions: 100,
    deletions: 50,
    approvalCount: 0,
    reviewers: [],
    ...overrides,
  };
}

function createMockConfig(overrides: Partial<Config> = {}): Config {
  return {
    settings: { default_severity: "error" },
    ticket: {
      pattern: "[A-Z]+-[0-9]+",
      check_in: ["title", "branch", "body"],
    },
    ...overrides,
  };
}

describe("checkTicketReference", () => {
  it("should pass when ticket is found in title", () => {
    const ctx: CheckContext = {
      pr: createMockPr({ title: "ABC-123: Add new feature" }),
      config: createMockConfig({
        ticket: { pattern: "[A-Z]+-[0-9]+", check_in: ["title"] },
      }),
    };

    const result = checkTicketReference(ctx);

    expect(result.status).toBe("passed");
    expect(result.rule).toBe("ticket.pattern");
    expect(result.message).toBe("Ticket found in: title");
  });

  it("should pass when ticket is found in branch", () => {
    const ctx: CheckContext = {
      pr: createMockPr({ branch: "feature/ABC-123-add-login" }),
      config: createMockConfig({
        ticket: { pattern: "[A-Z]+-[0-9]+", check_in: ["branch"] },
      }),
    };

    const result = checkTicketReference(ctx);

    expect(result.status).toBe("passed");
    expect(result.message).toBe("Ticket found in: branch");
  });

  it("should pass when ticket is found in body", () => {
    const ctx: CheckContext = {
      pr: createMockPr({ body: "Fixes ABC-123\n\nDescription here" }),
      config: createMockConfig({
        ticket: { pattern: "[A-Z]+-[0-9]+", check_in: ["body"] },
      }),
    };

    const result = checkTicketReference(ctx);

    expect(result.status).toBe("passed");
    expect(result.message).toBe("Ticket found in: body");
  });

  it("should pass and report all locations when ticket found in multiple places", () => {
    const ctx: CheckContext = {
      pr: createMockPr({
        title: "ABC-123: Add feature",
        branch: "feature/ABC-123-add-feature",
        body: "Resolves ABC-123",
      }),
      config: createMockConfig({
        ticket: { pattern: "[A-Z]+-[0-9]+", check_in: ["title", "branch", "body"] },
      }),
    };

    const result = checkTicketReference(ctx);

    expect(result.status).toBe("passed");
    expect(result.message).toBe("Ticket found in: title, branch, body");
  });

  it("should fail when no ticket is found in any location", () => {
    const ctx: CheckContext = {
      pr: createMockPr({
        title: "Add new feature",
        branch: "feature/add-login",
        body: "Some description without ticket",
      }),
      config: createMockConfig({
        ticket: { pattern: "[A-Z]+-[0-9]+", check_in: ["title", "branch", "body"] },
      }),
    };

    const result = checkTicketReference(ctx);

    expect(result.status).toBe("failed");
    expect(result.message).toBe("No ticket reference found in: title, branch, body");
  });

  it("should fail when ticket not found in configured locations only", () => {
    const ctx: CheckContext = {
      pr: createMockPr({
        title: "Add new feature",
        branch: "feature/add-login",
        body: "Fixes ABC-123", // Ticket is in body but we only check title
      }),
      config: createMockConfig({
        ticket: { pattern: "[A-Z]+-[0-9]+", check_in: ["title"] },
      }),
    };

    const result = checkTicketReference(ctx);

    expect(result.status).toBe("failed");
    expect(result.message).toBe("No ticket reference found in: title");
  });

  it("should skip when ticket pattern is not configured", () => {
    const ctx: CheckContext = {
      pr: createMockPr({ title: "No ticket" }),
      config: createMockConfig({ ticket: {} }),
    };

    const result = checkTicketReference(ctx);

    expect(result.status).toBe("skipped");
    expect(result.message).toBe("ticket pattern not configured");
  });

  it("should skip when ticket config is undefined", () => {
    const ctx: CheckContext = {
      pr: createMockPr({ title: "No ticket" }),
      config: { settings: { default_severity: "error" } },
    };

    const result = checkTicketReference(ctx);

    expect(result.status).toBe("skipped");
  });

  it("should use default check_in locations when not specified", () => {
    const ctx: CheckContext = {
      pr: createMockPr({
        title: "No ticket here",
        branch: "no-ticket-here",
        body: "ABC-123 is here",
      }),
      config: createMockConfig({
        ticket: { pattern: "[A-Z]+-[0-9]+" }, // No check_in specified
      }),
    };

    const result = checkTicketReference(ctx);

    expect(result.status).toBe("passed");
    expect(result.message).toBe("Ticket found in: body");
  });

  it("should handle null body gracefully", () => {
    const ctx: CheckContext = {
      pr: createMockPr({
        title: "ABC-123: Feature",
        body: null,
      }),
      config: createMockConfig({
        ticket: { pattern: "[A-Z]+-[0-9]+", check_in: ["title", "body"] },
      }),
    };

    const result = checkTicketReference(ctx);

    expect(result.status).toBe("passed");
    expect(result.message).toBe("Ticket found in: title");
  });

  it("should handle different ticket patterns", () => {
    const ctx: CheckContext = {
      pr: createMockPr({ title: "#123: Fix bug" }),
      config: createMockConfig({
        ticket: { pattern: "#[0-9]+", check_in: ["title"] },
      }),
    };

    const result = checkTicketReference(ctx);

    expect(result.status).toBe("passed");
  });

  it("should handle JIRA-style ticket numbers", () => {
    const ctx: CheckContext = {
      pr: createMockPr({ title: "PROJ-12345: Large ticket number" }),
      config: createMockConfig({
        ticket: { pattern: "[A-Z]+-[0-9]+", check_in: ["title"] },
      }),
    };

    const result = checkTicketReference(ctx);

    expect(result.status).toBe("passed");
  });

  it("should handle invalid regex patterns gracefully", () => {
    const ctx: CheckContext = {
      pr: createMockPr({ title: "Test PR" }),
      config: createMockConfig({
        ticket: { pattern: "[invalid(regex", check_in: ["title"] },
      }),
    };

    const result = checkTicketReference(ctx);

    expect(result.status).toBe("failed");
    expect(result.message).toContain("Invalid ticket pattern regex");
  });

  it("should use ticket severity when configured", () => {
    const ctx: CheckContext = {
      pr: createMockPr({ title: "No ticket" }),
      config: createMockConfig({
        ticket: { pattern: "[A-Z]+-[0-9]+", check_in: ["title"], severity: "warning" },
      }),
    };

    const result = checkTicketReference(ctx);

    expect(result.severity).toBe("warning");
  });

  it("should use default severity when ticket severity not configured", () => {
    const ctx: CheckContext = {
      pr: createMockPr({ title: "No ticket" }),
      config: createMockConfig({
        settings: { default_severity: "error" },
        ticket: { pattern: "[A-Z]+-[0-9]+", check_in: ["title"] },
      }),
    };

    const result = checkTicketReference(ctx);

    expect(result.severity).toBe("error");
  });

  describe("edge cases", () => {
    it("should find ticket at the start of the string", () => {
      const ctx: CheckContext = {
        pr: createMockPr({ title: "ABC-123 Fix the bug" }),
        config: createMockConfig({
          ticket: { pattern: "[A-Z]+-[0-9]+", check_in: ["title"] },
        }),
      };

      const result = checkTicketReference(ctx);

      expect(result.status).toBe("passed");
    });

    it("should find ticket at the end of the string", () => {
      const ctx: CheckContext = {
        pr: createMockPr({ title: "Fix the bug ABC-123" }),
        config: createMockConfig({
          ticket: { pattern: "[A-Z]+-[0-9]+", check_in: ["title"] },
        }),
      };

      const result = checkTicketReference(ctx);

      expect(result.status).toBe("passed");
    });

    it("should find ticket in the middle of the string", () => {
      const ctx: CheckContext = {
        pr: createMockPr({ title: "Fix ABC-123 bug in login" }),
        config: createMockConfig({
          ticket: { pattern: "[A-Z]+-[0-9]+", check_in: ["title"] },
        }),
      };

      const result = checkTicketReference(ctx);

      expect(result.status).toBe("passed");
    });

    it("should match multiple tickets in the same field (first match counts)", () => {
      const ctx: CheckContext = {
        pr: createMockPr({ title: "ABC-123 and DEF-456: Multiple tickets" }),
        config: createMockConfig({
          ticket: { pattern: "[A-Z]+-[0-9]+", check_in: ["title"] },
        }),
      };

      const result = checkTicketReference(ctx);

      expect(result.status).toBe("passed");
      expect(result.message).toBe("Ticket found in: title");
    });

    it("should handle lowercase ticket patterns", () => {
      const ctx: CheckContext = {
        pr: createMockPr({ title: "fix: abc-123 update" }),
        config: createMockConfig({
          ticket: { pattern: "[a-z]+-[0-9]+", check_in: ["title"] },
        }),
      };

      const result = checkTicketReference(ctx);

      expect(result.status).toBe("passed");
    });

    it("should be case sensitive for JIRA-style tickets by default", () => {
      const ctx: CheckContext = {
        pr: createMockPr({ title: "abc-123: lowercase ticket" }),
        config: createMockConfig({
          ticket: { pattern: "[A-Z]+-[0-9]+", check_in: ["title"] },
        }),
      };

      const result = checkTicketReference(ctx);

      // Pattern requires uppercase, so lowercase should fail
      expect(result.status).toBe("failed");
    });

    it("should handle case insensitive pattern with regex flag", () => {
      const ctx: CheckContext = {
        pr: createMockPr({ title: "abc-123: lowercase ticket" }),
        config: createMockConfig({
          // Using character class to match both cases
          ticket: { pattern: "[A-Za-z]+-[0-9]+", check_in: ["title"] },
        }),
      };

      const result = checkTicketReference(ctx);

      expect(result.status).toBe("passed");
    });

    it("should handle empty title", () => {
      const ctx: CheckContext = {
        pr: createMockPr({ title: "" }),
        config: createMockConfig({
          ticket: { pattern: "[A-Z]+-[0-9]+", check_in: ["title"] },
        }),
      };

      const result = checkTicketReference(ctx);

      expect(result.status).toBe("failed");
    });

    it("should handle empty branch", () => {
      const ctx: CheckContext = {
        pr: createMockPr({ branch: "" }),
        config: createMockConfig({
          ticket: { pattern: "[A-Z]+-[0-9]+", check_in: ["branch"] },
        }),
      };

      const result = checkTicketReference(ctx);

      expect(result.status).toBe("failed");
    });

    it("should handle empty body (not null)", () => {
      const ctx: CheckContext = {
        pr: createMockPr({ body: "" }),
        config: createMockConfig({
          ticket: { pattern: "[A-Z]+-[0-9]+", check_in: ["body"] },
        }),
      };

      const result = checkTicketReference(ctx);

      expect(result.status).toBe("failed");
    });

    it("should handle ticket with very long number", () => {
      const ctx: CheckContext = {
        pr: createMockPr({ title: "PROJECT-123456789: Very old ticket" }),
        config: createMockConfig({
          ticket: { pattern: "[A-Z]+-[0-9]+", check_in: ["title"] },
        }),
      };

      const result = checkTicketReference(ctx);

      expect(result.status).toBe("passed");
    });

    it("should handle ticket with very long project key", () => {
      const ctx: CheckContext = {
        pr: createMockPr({ title: "VERYLONGPROJECTKEY-123: Long key" }),
        config: createMockConfig({
          ticket: { pattern: "[A-Z]+-[0-9]+", check_in: ["title"] },
        }),
      };

      const result = checkTicketReference(ctx);

      expect(result.status).toBe("passed");
    });

    it("should handle GitHub issue style references (#123)", () => {
      const ctx: CheckContext = {
        pr: createMockPr({ body: "Closes #456" }),
        config: createMockConfig({
          ticket: { pattern: "#[0-9]+", check_in: ["body"] },
        }),
      };

      const result = checkTicketReference(ctx);

      expect(result.status).toBe("passed");
    });

    it("should handle special characters around ticket", () => {
      const ctx: CheckContext = {
        pr: createMockPr({ title: "[ABC-123] Fix the bug" }),
        config: createMockConfig({
          ticket: { pattern: "[A-Z]+-[0-9]+", check_in: ["title"] },
        }),
      };

      const result = checkTicketReference(ctx);

      expect(result.status).toBe("passed");
    });

    it("should handle ticket in URL format", () => {
      const ctx: CheckContext = {
        pr: createMockPr({ body: "See https://jira.example.com/browse/ABC-123" }),
        config: createMockConfig({
          ticket: { pattern: "[A-Z]+-[0-9]+", check_in: ["body"] },
        }),
      };

      const result = checkTicketReference(ctx);

      expect(result.status).toBe("passed");
    });

    it("should not match partial ticket patterns", () => {
      const ctx: CheckContext = {
        pr: createMockPr({ title: "ABC- fix without number" }),
        config: createMockConfig({
          ticket: { pattern: "[A-Z]+-[0-9]+", check_in: ["title"] },
        }),
      };

      const result = checkTicketReference(ctx);

      expect(result.status).toBe("failed");
    });

    it("should not match when only number is present", () => {
      const ctx: CheckContext = {
        pr: createMockPr({ title: "Fix bug 123" }),
        config: createMockConfig({
          ticket: { pattern: "[A-Z]+-[0-9]+", check_in: ["title"] },
        }),
      };

      const result = checkTicketReference(ctx);

      expect(result.status).toBe("failed");
    });

    it("should handle unicode in surrounding text", () => {
      const ctx: CheckContext = {
        pr: createMockPr({ title: "ABC-123: Añadir función de búsqueda" }),
        config: createMockConfig({
          ticket: { pattern: "[A-Z]+-[0-9]+", check_in: ["title"] },
        }),
      };

      const result = checkTicketReference(ctx);

      expect(result.status).toBe("passed");
    });

    it("should handle multiline body with ticket", () => {
      const ctx: CheckContext = {
        pr: createMockPr({
          body: `## Description
This PR fixes a bug.

## Ticket
ABC-123

## Testing
Manual testing completed.`,
        }),
        config: createMockConfig({
          ticket: { pattern: "[A-Z]+-[0-9]+", check_in: ["body"] },
        }),
      };

      const result = checkTicketReference(ctx);

      expect(result.status).toBe("passed");
    });
  });
});
