CODE
Linting checks
Ensuring certain files exist in git repo
Ensuring that code is modular
Setting limits on things like file size, function size, etc.
Enforcing consistent code formatting (Prettier, Black, gofmt, etc.)
Static type checking (TypeScript strict mode, mypy, etc.)
Dead code detection
Cyclomatic complexity limits
Documentation coverage (docstrings, JSDoc, etc.)
Input validation standards
SQL injection and XSS prevention checks
README requirements
CHANGELOG maintenance
API documentation (OpenAPI/Swagger)
Architecture Decision Records (ADRs)
Runbook/playbook requirements for services
Logging standards and structured logging
Health check endpoints
Database query performance checks (no N+1 queries)
Caching strategy requirements
Ensuring that the right tools are being used for the project (e.g., FastAPI, correct programming language, etc.)
License compliance checking for dependencies
Secret scanning (preventing API keys, passwords in code)
PROCESS
Running unit tests
Ensuring certain % unit test coverage
Ensuring that nothing is merging into main without a PR
Ensuring that Code Rabbit comments are resolved inside a PR
Ensuring that the right CI checks are there and pass before merging
Ensuring that there is high integration test coverage
Ensuring that there is high end-to-end test coverage
Ensuring the right monitoring is being added to the tool
Dependency vulnerability scanning (Dependabot, Snyk, etc.)
Mutation testing thresholds
Performance/load testing requirements
Contract testing for APIs
Snapshot testing for UI components
Test isolation (no shared state between tests)
Flaky test detection and quarantine
SAST (Static Application Security Testing)
DAST (Dynamic Application Security Testing)
Authentication/authorization review requirements
Commit message format enforcement (Conventional Commits)
Branch naming conventions
Required reviewers/approvals (CODEOWNERS)
Signed commits
Linear history (no merge commits, or rebasing policy)
Protected branch rules
Squash merge requirements
Infrastructure as Code validation (Terraform plan, etc.)
Container image scanning
Deployment rollback capabilities
Feature flag standards
Environment parity checks
Database migration review requirements
Distributed tracing requirements
Alerting thresholds defined
SLO/SLI definitions
Error tracking integration (Sentry, etc.)
Bundle size limits (for frontend)
API response time thresholds
Memory leak detection


Here are the areas with overlap:
Linting & Formatting

CODE: Check if linting config exists (.eslintrc, .flake8, etc.), check if code conforms to formatting rules
PROCESS: Ensure linting actually runs in CI, enforce it blocks merges

Type Checking

CODE: Check if type config exists (tsconfig.json, mypy.ini), check if type annotations are present
PROCESS: Ensure type checker runs in CI, enforce it passes before merge

Testing

CODE: Check if test files exist, check test-to-code ratio, check for test patterns/structure
PROCESS: Ensure tests actually run, measure coverage percentage, enforce coverage thresholds

Secret Scanning

CODE: Scan repo for hardcoded secrets/patterns
PROCESS: Ensure GitHub secret scanning or similar is enabled, alerts are actioned

Documentation

CODE: Check if README/CHANGELOG/ADRs exist, check if docstrings are present
PROCESS: Measure documentation coverage percentage, enforce thresholds

Dependency Management

CODE: Check if lockfiles exist, check for outdated dependencies in manifest
PROCESS: Ensure Dependabot/Snyk is enabled and running, alerts are actioned

License Compliance

CODE: Check declared licenses in package manifests
PROCESS: Run license scanner tool, enforce approved license list

Code Complexity

CODE: Check function/file line counts (simple static analysis)
PROCESS: Run cyclomatic complexity analysis, enforce thresholds

Security Patterns

CODE: Check for obvious anti-patterns (eval, dangerouslySetInnerHTML, raw SQL)
PROCESS: Run SAST tools, enforce findings are addressed

API Documentation

CODE: Check if OpenAPI/Swagger files exist
PROCESS: Validate spec is accurate/up-to-date, run contract tests

Logging & Observability

CODE: Check for logger imports/usage, check if health check routes exist
PROCESS: Ensure logs ship to aggregator, ensure monitoring is configured