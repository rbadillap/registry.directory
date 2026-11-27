# `packages/organizations`

Teams and access for the registry.directory Dashboard. It answers one question
everywhere it's asked: **can this identity do this to this resource?**

> **Draft.** We're still designing, and this file gets rewritten as decisions
> close. No code yet.

## Three layers

It plugs into your design system; it doesn't compete with it.

1. **The core, with no React.** Logic, schema, database rules, tokens,
   `can()` and `requireCan()`. `/r`, the MCP App and scripts use it without
   loading React. It lives here, in `packages/organizations/`.
2. **Behavior components, with React and no styles.** They live in this same
   package under a separate export (`@workspace/organizations/react`, or
   whatever name the monorepo settles on), so code that only needs the core
   never pulls in React. They bring the behavior, not the look: you pass the
   visual piece in as a prop (a render prop or a slot). For example, a
   `TeamSwitcher` knows which teams you have, switches between them and
   respects permissions, but takes the team menu as a prop. They ship through
   npm, not the registry, because they're logic: they update with the package,
   and nobody should need to copy or fork them.
3. **Recipes, as shadcn registry items.** Examples that build each piece end
   to end with shadcn on top of layers 1 and 2. You install one with
   `npx shadcn add @registrydirectory/organizations/<item>` and change it as
   you like. The Dashboard uses these same recipes. They live in
   `registry/organizations/`:
   - the team switcher;
   - the member list: invite, remove, change role;
   - the create-token dialog, which shows the secret once;
   - the activity log;
   - the "you don't have permission" message.

## What the core does

- **Teams.** A team is the unit that owns things. Each one has a readable,
  unique **handle**, the same in every place it shows up: the web
  (`/dashboard/{handle}`), the shadcn CLI (`@registrydirectory/{handle}/{item}`)
  and the MCP App.
- **Members and roles.** A **permission** is `thing:action`, for example
  `presets:write`. A **role** is a named group of permissions. There are two
  today: Owner and Member.
- **The Platform team.** Platform permissions (reviewing submissions, reading
  origins, editing the home page, reading cross-team analytics) don't come from
  any role. Only the Platform team holds them.
- **Tokens.** A team issues tokens for the CLI and agents. Each token carries
  scopes, which can never be more than its creator's permissions.
- **One check.** `can(identity, permission, resource)` denies by default and
  records every denial. `requireCan()` is the version that stops the request.
- **Audit.** Every denial and every sensitive change is recorded, and the
  record can only grow.

The database enforces the same rules the app decides, with Postgres row-level
security and triggers: one team never sees another team's rows, the Platform
team can't be deleted, a team is never left without an Owner, a token never
outranks its creator, and the audit log is insert-only.

## What it doesn't do

- **Sign people in.** Identity comes from outside (Auth0 today) through an
  adapter. This package only decides what that identity may do.
- **Serve `/r`.** It verifies the token; `/r` serves the item.
- **Record product events.** That is [`packages/feedback`](../feedback).

## Concepts and API

| Area | API |
|---|---|
| Permissions | `Permission`: a union of `thing:action` strings. Team: `items:read`, `items:save`, `items:mark`, `presets:write`, `rules:read`, `rules:write`, `activity:read`, `members:manage`, `tokens:manage`, `settings:write`. Platform: `submissions:review`, `origins:read`, `home:edit`, `analytics:read`. |
| Roles | `owner` holds every team permission. `member` holds `items:*`, `rules:read`, `rules:write` and `activity:read`. |
| Check | `can(identity, permission, resource) → boolean`, `requireCan(...)` |
| Teams | `createTeam(userId)` creates a team with an automatic, neutral handle; `renameHandle(teamId, handle)`; `resolveHandle(handle) → teamId`, following aliases |
| Members | `addMember`, `removeMember`, `setRole` |
| Tokens | `createToken(teamId, scopes, expiresAt)` returns the secret once; `verifyToken(secret) → identity`; `revokeToken(id)` |
| Audit | `listActivity(teamId)` |

## Depends on and used by

- **Depends on:** Postgres (Neon) through Drizzle, and an identity adapter
  (Auth0).
- **Used by:** `apps/web` (Dashboard routes and actions), `/r` (`verifyToken`
  and `items:read` for private items) and the MCP App server. Later, the MCP
  App will also use `can()` on the connected token to decide which tools to
  offer, so an Owner gets the admin tools without leaving the chat.

Working on this package? Read [`AGENTS.md`](AGENTS.md) first.
