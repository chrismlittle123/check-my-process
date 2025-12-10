---
"check-my-process": patch
---

fix: improve CI workflows and add knip:check script

- Add `knip:check` script to package.json for non-blocking unused code checks
- Fix release workflow to skip tag/release creation if they already exist
- Update PR branch naming pattern to allow both slash and dash separators (e.g., `feature/v1.1.0/desc` or `feature/v1.1.0-desc`)
