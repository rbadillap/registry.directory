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
6. **Admin is a platform role, kept apart from team roles.** `setRole`
   handles only a team's own roles, and no Owner can grant Admin. Only
   another Admin or a database migration assigns it: a trigger blocks any
   other path, and every assignment is audited. The platform is never left
   without an Admin, just as a team is never left without an Owner.
7. **Every team table has `team_id` and forced row-level security.** The app
   connects with a `NOBYPASSRLS` role.
8. **Handles are unique** and respect the reserved list shared with the site's
   routes. That list includes the name of every package of ours (`feedback`,
   `organizations` and any future one), because their kits install at the same
   level as team handles: `@registrydirectory/feedback/<item>`.

   **Temporary, until the cut-over from the current `/r`:** team handles and
   directory keys share one namespace both ways. Onboarding rejects any
   directory key as a handle, and the indexer refuses a new registry whose key
   is already a team's handle. While both `/r`s live side by side, the new one
   serves team handles and everything else falls through to the current one,
   so a team named `efferd` would hide that registry. Review this rule at the
   cut-over.
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
11. **Permissions live in code; roles live in data.** The permission list is
    fixed and typed. Roles are rows per team, and `can()` resolves role →
    permissions from the database. Never hardcode a role's permissions in a
    check.
12. **Owner is immutable.** It can't be edited or deleted and always holds
    every team permission. The system roles (Owner, Member, Viewer) are
    created with each team and can't be deleted.
13. **A custom role holds only team permissions,** never platform ones.
14. **Nobody grants what they don't hold,** whether building a role, assigning
    one or creating a token.

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
