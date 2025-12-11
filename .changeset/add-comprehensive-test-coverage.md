---
"check-my-process": patch
---

Add comprehensive test coverage with 64 new tests covering edge cases and error handling:

- Config loader: invalid TOML syntax, directory paths, empty files
- GitHub client: API errors (404, 401, 403, rate limiting, network failures, timeouts)
- Branch checks: empty/long names, special characters, unicode, case sensitivity
- Ticket checks: position detection, multiple tickets, case sensitivity, empty fields
- PR size checks: boundary values (0 files/lines, exact limits, very large counts)
- Formatter: empty results, special characters, unicode, various output scenarios
