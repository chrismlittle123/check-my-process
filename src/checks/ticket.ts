import type { CheckContext, CheckResult } from "./types.js";

export function checkTicketReference(ctx: CheckContext): CheckResult {
  const pattern = ctx.config.ticket?.pattern;
  const checkIn = ctx.config.ticket?.check_in ?? ["title", "branch", "body"];
  const severity = ctx.config.ticket?.severity ?? ctx.config.settings.default_severity;

  if (!pattern) {
    return {
      rule: "ticket.pattern",
      status: "skipped",
      message: "ticket pattern not configured",
      severity,
    };
  }

  let regex: RegExp;
  try {
    regex = new RegExp(pattern);
  } catch {
    return {
      rule: "ticket.pattern",
      status: "failed",
      message: `Invalid ticket pattern regex: ${pattern}`,
      expected: pattern,
      severity,
    };
  }

  const locations: Record<string, string | null> = {
    title: ctx.pr.title,
    branch: ctx.pr.branch,
    body: ctx.pr.body,
  };

  const foundIn: string[] = [];
  for (const loc of checkIn) {
    const text = locations[loc];
    if (text && regex.test(text)) {
      foundIn.push(loc);
    }
  }

  const passed = foundIn.length > 0;
  return {
    rule: "ticket.pattern",
    status: passed ? "passed" : "failed",
    message: passed
      ? `Ticket found in: ${foundIn.join(", ")}`
      : `No ticket reference found in: ${checkIn.join(", ")}`,
    expected: pattern,
    severity,
  };
}
