# site-core

Shared implementation primitives for sites built from this template.

## Belongs here

- framework-agnostic CSS foundations;
- layout primitives;
- stable cross-site browser fixes;
- helpers/components that are genuinely reused across client sites.

## Does not belong here

- client branding;
- client copy;
- local SEO facts;
- site-specific page structure;
- one-off integrations.

## Current status

Source only. It is not published to any registry, and a site must never depend
on it at runtime from another repository.

`src/styles/global.css` carries the same baseline directly, so a site works
with no registry access. Keep the two in step: a change to one is a change to
both, in the same commit.

The next step, once a distribution path is chosen, is to publish it as a
package. Until then, a site created from this template gets its own copy.
