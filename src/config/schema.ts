export type Severity = "error" | "warning";

export interface SettingsConfig {
  default_severity: Severity;
}

export interface PrConfig {
  max_files?: number;
  max_lines?: number;
  min_approvals?: number;
  severity?: Severity;
}

export interface BranchConfig {
  pattern?: string;
  severity?: Severity;
}

export interface TicketConfig {
  pattern?: string;
  check_in?: ("title" | "branch" | "body")[];
  severity?: Severity;
}

export interface Config {
  settings: SettingsConfig;
  pr?: PrConfig;
  branch?: BranchConfig;
  ticket?: TicketConfig;
}

export const DEFAULT_CONFIG: Config = {
  settings: {
    default_severity: "error",
  },
  pr: {
    max_files: 20,
    max_lines: 400,
    min_approvals: 1,
  },
  branch: {
    pattern: "^(feature|fix|hotfix)/[A-Z]+-[0-9]+-[a-z0-9-]+$",
  },
  ticket: {
    pattern: "[A-Z]+-[0-9]+",
    check_in: ["title", "branch", "body"],
  },
};
