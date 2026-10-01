# TBOX Web Platform Standards — local snapshot

This file travels with the site so developers and coding agents can work
without access to any other GitHub organization.

Platform standards version: **1** (must match `standardsVersion` in
`site-platform.json`).

Canonical sources:

- universal and web standards — the public Standards repository;
- Astro standards, enforcement and versioning — the Astro-SEO-PPC platform
  template.

A site reads this snapshot, not those repositories. Updates arrive by pull
request (see [Versioning and updates](#versioning-and-updates)).

## Universal

- A problem solved once should become a reusable rule, test, template,
  component or package.
- Build production sites from the approved template for their framework.
- Do not weaken or delete a standards check merely to make CI pass.
- Accessibility, responsive behaviour, security, SEO, analytics integrity and
  performance are product requirements.
- Never commit secrets, credentials, production tokens or customer PII.
- Reusable solutions belong upstream; client-specific decisions stay in this
  repository.

## Web

- Pages must not unintentionally scroll horizontally.
- Required phone widths: 320, 360, 390 and 414 px. Also verify representative
  tablet/desktop widths (768, 1024, 1440 px).
- Do not use global `overflow-x: hidden` as the default fix for layout
  overflow.
- Check fixed widths, `100vw`, negative margins, transforms, positioned
  decoration, non-shrinking flex/grid children, long unbroken text, oversized
  media and fixed/sticky UI.
- Images, video, SVG and iframes must be responsive.
- Forms need programmatic labels, useful errors, keyboard access and visible
  focus.
- Sticky/fixed UI must not obscure focused controls.
- Staging must not be indexable; production canonicals, robots and sitemaps
  must be verified.
- Define canonical conversion events once and prevent duplicates.
- Never place PII in analytics without explicit approval.
- Client-side validation is not a security boundary; APIs and forms need
  server-side validation.
- Measure representative phone and desktop performance, including third-party
  cost.

## Astro

### Approved starting point

A new Astro site starts from this template (**Use this template → Create a new
repository**). Do not start from `npm create astro` and reconstruct the
conventions by hand.

### Required repository files

- `site-platform.json`
- `AGENTS.md`
- `CLAUDE.md`
- `docs/PLATFORM_STANDARDS.md` (this file)
- `.github/workflows/standards.yml`
- `scripts/check-horizontal-overflow.mjs`
- a global style foundation derived from `packages/site-core`
- a README with the project's deployment and domain facts

### Required package scripts

- `dev`
- `check`
- `build`
- `test`
- `standards:responsive`
- `standards`

`npm run standards` is the local equivalent of the CI gate.

### Responsive gate

After a production build, the responsive checker must:

1. enumerate every emitted HTML route;
2. serve the built site locally;
3. test every route at 320, 360, 390 and 414 px;
4. fail if the document can scroll horizontally;
5. report the elements responsible — both elements whose box sits outside the
   viewport and elements whose content spills out of their box — with their
   geometry and `white-space`.

The correct response to a failure is to fix the component or layout. Do not add
a global clipping rule to make the gate green. `scrollIntoView()` also scrolls
horizontally, so it will expose any page overflow: fix the overflow before
changing scroll code.

### Shared code

Reusable layout primitives, base styles, helpers and cross-site behaviour move
to `packages/site-core` once they are stable and genuinely cross-project.

Client copy, branding, page architecture, local SEO facts and project-specific
integrations stay in the client repository.

### Deployment gate

A production deployment does not proceed unless:

- standards pass;
- tests pass;
- the build passes;
- secrets checks pass where applicable;
- staging indexability is correct;
- production-domain assumptions have been verified.

## Enforcement

Documentation alone is not enforcement. Four controls apply.

1. **Approved template.** Every new site begins from this template, which
   carries the agent instructions, this snapshot, base styles, test scripts,
   the responsive checker and a local CI workflow.
2. **Self-contained CI.** Every site carries its own
   `.github/workflows/standards.yml`. An independently owned private repository
   must not depend on a private workflow in another organization to pass CI.
3. **Required status check.** Where branch protection or rulesets are
   available, the `Standards` check is required on the default branch. The
   ruleset belongs to the repository's actual owner.
4. **Versioned adoption.** A site is initialized only when it came from the
   template, passes `npm run standards` locally, has its local workflow
   running, has production/staging domains recorded, declares its
   `standardsVersion`, is recorded in the platform's site inventory, and
   requires the Standards check where supported.

## Existing sites

Adopt by pull request, not by replacing the project's architecture:

1. add `site-platform.json` and this snapshot;
2. add the responsive checker and npm scripts;
3. add the local Standards workflow;
4. run it without masking failures;
5. fix the real failures;
6. then make the check required.

## Versioning and updates

The template is the current default for new sites. A site created from it does
not receive later template changes automatically. A platform update therefore:

- increments the platform standards version;
- compares it against the platform's site inventory;
- opens update PRs in each site repository, limited to governed files where
  practical;
- lets each site's local CI prove compatibility.

A site may lag a version only with a tracked reason.
