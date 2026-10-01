# Claude Project Rules

Read `AGENTS.md` and `docs/PLATFORM_STANDARDS.md` first.

This site is independently owned. It must build, test and pass CI without
access to any other organization's repositories.

For every completed task:

1. preserve responsive behaviour;
2. run `npm run standards`;
3. fix failures rather than suppressing them — never weaken or delete a gate;
4. keep client-specific work (copy, branding, local SEO facts, findings,
   integrations) in this repository;
5. name any reusable improvement that should be promoted upstream, so the
   lesson is not trapped in this repo.

## If this is the template repository itself

When GitHub marks this repository as a template, changes here reach every
future site, and land in the first commit of every client repository. Client
repositories are public, so:

- nothing client-specific is ever committed here — no client names, domains,
  findings, credentials or content;
- nothing platform-only is committed here either — production method, site
  inventory, architecture and direction notes live in the private platform
  repository. CI fails if one of those paths appears;
- the template must pass `npm run standards` on its own;
- a change to `src/styles/global.css` is mirrored in
  `packages/site-core/styles.css` in the same commit.
