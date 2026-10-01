# Agent Instructions

This repository follows the TBOX Web Platform standards, at the version
recorded in `site-platform.json`.

Read `docs/PLATFORM_STANDARDS.md` before changing architecture or touching a
test.

Rules:

- This repository is independently owned. Do not assume it belongs to any
  other GitHub organization, and do not add a runtime or CI dependency on one.
- Do not bypass, delete or weaken a standards gate to make CI pass. Fix the
  underlying defect.
- Fix horizontal overflow at the offending element. Global overflow clipping
  (`overflow-x: hidden` on `html`, `body` or a page wrapper) is not a fix.
- Project-specific decisions, content and findings belong in this repository.
- A reusable lesson does not stay here. Propose it upstream:
  - generic and safe to publish → the public Standards repository;
  - Astro, SEO, PPC or production method → the Astro-SEO-PPC platform
    repository.
- Run `npm run standards` before declaring work complete. Work is not complete
  while it fails.
