---
"check-my-process": patch
---

Improve CLI validation and implement init command

- Implement `init` command to create starter `cmp.toml` config file with `--force` option
- Validate `--format` option (must be "text" or "json")
- Validate `--pr` must be a positive integer (rejects 0, -1, etc.)
- Validate `--repo` format strictly (exactly owner/repo, rejects paths like a/b/c)
- Show clear message when `validate` runs without config file present
- Fix exit code to 0 when running `cmp` with no command (shows help)
