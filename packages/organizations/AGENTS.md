# AGENTS.md: `packages/organizations`

What this package is and what it does live in [`README.md`](README.md). This
file is the rules for changing it.

> **Status:** design only, no code yet. Two points are open, listed at the end.

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
   routes.
9. **A non-member gets 404, never 403**, so a response never reveals that a
   team exists. This applies to `/r/{handle}/...` and `/dashboard/{handle}`.

## Open

Don't implement either of these until they're decided.

- Whether `rules:write` belongs only to Owner, or to Member too.
- What a **member** without the permission receives: 404 like everyone else,
  or 403 with a message (the shadcn CLI shows the response's `message` field).
  A non-member always gets 404.

## Boundaries

- No sign-in code here. Identity arrives through an adapter.
- No product event logging. Use [`packages/feedback`](../feedback).
- No imports from `apps/web`. The app depends on this package, not the other
  way around.
- A rule the app enforces should also hold in the database (a policy or a
  trigger). If you add one in only one place, say why in the change.
