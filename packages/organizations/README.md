# `packages/organizations`

Teams and access for the registry.directory Dashboard. It answers one question
everywhere it's asked: **can this identity do this to this resource?**

> **Status:** design only, no code yet. The model and the API below are
> settled.

## What it does

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
- **Draw any UI.**
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
  and `items:read` for private items) and the MCP App server.

Working on this package? Read [`AGENTS.md`](AGENTS.md) first.
