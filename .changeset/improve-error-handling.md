---
"check-my-process": patch
---

Improve error handling and message clarity

- Fix "Config is valid" message appearing before validation errors
- Handle permission denied errors gracefully in init command
- Sanitize config parse errors to avoid leaking file contents
- Detect and report when config path is a directory
- Include field names in unknown property validation errors
