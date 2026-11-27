# AGENTS.md: `packages/organizations`

What this package is and what it does live in [`README.md`](README.md). This
file is the rules for changing it.

> **Draft.** We're still designing, and this file gets rewritten as decisions
> close. No code yet.

## Invariants

Never break these. If a change needs to, stop and ask.

1. **Deny by default.** An unknown permission, no identity, no membership or a
   database error all mean no.
2. **Authorize by `team_id`, never by handle.** The handle only selects the
   team; the check runs on the id. In `/r`, `verifyToken` gives the token's
   `team_id`, `items:read` is checked against it, and the handle in the URL
   must match that `team_id`.
3. **A token never outranks its creator.** Its scopes are a subset of the
   creator's permissions at the moment it's created.
4. **Token secrets are stored hashed** and shown once, at creation.
5. **The audit log is insert-only.** No update or delete, enforced by grants
   or a trigger. It records every denial and every sensitive change.
6. **The Platform team can't be deleted, transferred or have its members
   changed from the app.**
7. **Every team table has `team_id` and forced row-level security.** The app
   connects with a `NOBYPASSRLS` role.
8. **Handles are unique** and respect the reserved list shared with the site's
   routes. That list includes the name of every package of ours (`feedback`,
   `organizations` and any future one), because their kits install at the same
   level as team handles: `@registrydirectory/feedback/<item>`.
9. **A non-member gets 404, never 403**, so a response never reveals that a
   team exists. This applies to `/r/{handle}/...` and `/dashboard/{handle}`.
10. **A member without the permission gets 403 with a clear `message`.** The
    shadcn CLI shows that field to the person, and the MCP App shows the same
    text. The message names the action and who to ask, never the technical
    permission:
    - "You can't install private components from acme. Ask an Owner of acme
      for access."
    - "Only Owners of acme can create tokens."

    The technical permission goes in a separate field of the response
    (`"permission": "items:read"`) and in the log, for debugging.

## Boundaries

- **Three layers, kept apart** (see the README):
  - The core has no React and no styles. Nothing outside the `react` export
    may import React.
  - A behavior component in the `react` export never sets the look. Anything
    visual comes in through props (a render prop or a slot), and it has no
    styles of its own.
  - Recipes are shadcn registry items in `registry/organizations/`, built on
    the core and the `react` export. They never go inside this package.
- No sign-in code here. Identity arrives through an adapter.
- No product event logging. Use [`packages/feedback`](../feedback).
- No imports from `apps/web`. The app depends on this package, not the other
  way around.
- A rule the app enforces should also hold in the database (a policy or a
  trigger). If you add one in only one place, say why in the change.
