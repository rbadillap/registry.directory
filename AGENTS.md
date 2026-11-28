# AGENTS.md

Rules for agents working in this repository. What the project is, and how a
person gets started, lives in [`README.md`](README.md).

> **Draft.** The Dashboard is being built on `main`, turned off in production
> behind `DASHBOARD_ENABLED`, and this file gets rewritten as decisions close.

## Stack

- **Monorepo:** Turborepo and pnpm workspaces (`apps/*`, `packages/*`).
  pnpm 10, Node 24.
- **Site:** `apps/web`, Next.js 15 (App Router), React 19, TypeScript.
- **UI:** Tailwind CSS v4 and shadcn/ui, with the shared components in
  `packages/ui` (Radix underneath).
- **Secrets:** Varlock, from `apps/web/.env.schema`. Nothing secret is needed
  to run the site locally.
- **Hosting:** Vercel, with Vercel Blob for submissions.
- **Planned for the Dashboard** (behind `DASHBOARD_ENABLED`):
  `@auth0/nextjs-auth0` for identity only, `drizzle-orm` with `drizzle-kit`
  on `@neondatabase/serverless`, `@google/design.md` to validate and export
  a team's brand, and `mcp-handler` with
  `@modelcontextprotocol/server` and `@modelcontextprotocol/ext-apps` for the
  MCP App. The behavior layer of our packages (`Ask`, `TeamSwitcher`) is built
  on UI SDK (`@ui-sdk/react`, `@ui-sdk/core`), pinned to exact versions; the
  app itself stays on shadcn/ui. See
  [`packages/organizations`](packages/organizations) and
  [`packages/feedback`](packages/feedback).

## Branches and environments

- **One trunk, `main`, and short-lived branches.** Every slice enters `main`
  through a small pull request. There are no long-lived branches: they drift
  from `main`, which changes almost daily with submissions and the indexer.
- **Unfinished work merges turned off,** behind `DASHBOARD_ENABLED`.
  Production follows `main` with the flag off, and every production deployment
  waits for a manual Promote. The `dev` environment (`dev.registry.directory`)
  follows `main` with its own variables and the flag on, for testing.
- **Launching is turning the flag on in production; rolling back is turning it
  off.** Neither is a merge.
- Each environment has its own database branch, and nothing in one
  environment reads another's data.

## Architecture of the Dashboard (behind `DASHBOARD_ENABLED`)

registry.directory helps a team create its design system and serves it under
the team's handle: private, with a token, and counting what gets used.
Everything else (members, agent rules, the MCP App, the directory) is a way to
reach that same `/r`.

- **A team's brand is a [DESIGN.md](https://github.com/google-labs-code/design.md),**
  the open spec that describes a visual identity to coding agents. It's created
  in the Dashboard, from a shadcn preset, or imported, and stored and served
  from our database. Connecting a design system that already lives in a
  team's repo comes later.
- **Three faces over one API,** authenticated with tokens: the web
  (`/dashboard`), an **MCP App** inside Claude, and `/r` for the shadcn CLI.
- **The web is where you manage; the MCP App is where you work.** The MCP App
  supports Claude first, and links to the exact web screen for anything
  administrative. Later it offers more tools by role, filtered with `can()` on
  the connected token.
- **Inside a team, people install only the team's items.** Searching the whole
  directory without an account stays a personal use.
- **Build order,** one section at a time, each lighting up its block in the
  Overview:
  1. Brand: create your design system
  2. Members and roles
  3. Agent rules and Connect (the brand's do's and don'ts are the first rules)
  4. Find your items from Claude

  Later: a public link to a team's DESIGN.md; connecting an existing design
  system; Inconsistencies, Activity, a free catalog; and searching the whole
  directory.

## Database names

- Three schemas, each with one owner: `dashboard` (`brands`, `items`,
  `agent_rules`), `organizations` (`users`, `teams`, `members`, `roles`,
  `role_permissions`, `invitations`, `tokens`, `handle_aliases`) and
  `feedback` (`events`, `settings`).
- Table names are words from the product, in English, plural and snake_case.
- Common columns: `id`, `team_id`, `created_at`, `created_by`, and
  `updated_at` where rows are edited. `feedback.events` has no `created_by`
  on purpose.
- `users` holds only `id` and the Auth0 subject. Names and emails stay in
  Auth0.
- Every table and column has a plain-language `COMMENT`, written in the
  migration SQL, and a test fails if one is missing.
- Row-level security policies have readable names, such as "members see their
  team's items".

The site's routes, `/r` rules and interface names are in
[`apps/web/AGENTS.md`](apps/web/AGENTS.md).

## Commands

```bash
pnpm install
pnpm dev                      # every app, in watch mode
pnpm build                    # production build
pnpm lint                     # eslint, all packages
pnpm --filter web typecheck
pnpm --filter web test
```

## Where documentation goes

Two files per folder, and only where a folder needs them:

- **`README.md` is for people.** What it is and a basic guide to get going.
  Code first: each concept gets a short example of how it's used, with the
  explanation around the code. A diagram only when it explains something the
  code can't.
- **`AGENTS.md` is for agents.** The rules for changing that part: its
  invariants and its boundaries. It doesn't repeat what a level above already
  says.

Each level documents only itself and links down. Don't add a `CLAUDE.md`:
Claude Code reads `AGENTS.md` directly, and a `CLAUDE.md` would make it skip
this file.

| Path | What its `AGENTS.md` covers |
|---|---|
| `/` (this file) | The stack, the architecture, the commands and the rules for the whole repo |
| [`apps/web`](apps/web/AGENTS.md) | Routes and reserved names, `/r`, interface names, the empty state |
| [`packages/organizations`](packages/organizations/AGENTS.md) | Teams, roles, permissions, tokens and audit |
| [`packages/feedback`](packages/feedback/AGENTS.md) | The Feedback Loop: track, answer, measure, status |

Other places:

- **Skills** live in [`skills/`](skills), one folder per skill with its
  `SKILL.md`, linked from `.claude/skills/`. A skill is a procedure an agent
  follows step by step, such as reviewing submissions. Context that applies
  to every task belongs in an `AGENTS.md`, not in a skill.
- **Engineers** (agent definitions) live in [`.claude/agents/`](.claude/agents).
  Each engineer maintains its own definition so it can evolve. A definition
  describes a role and nothing else: no people, projects, accounts or history.

## Engineering principle: sensible defaults, customizable without code

The system ships with defaults that work out of the box, and the model is
designed so each team can change them without touching code. Defaults are
data, not hardcoded behavior.

- Every team is born with the Owner, Member and Viewer roles, but roles are
  rows and teams can create their own.
- Feedback ships with default questions and thresholds, and each one can be
  adjusted.
- A team's brand can start from a shadcn preset and become its own DESIGN.md.

When you design something new, ask two questions: what's the sensible
default, and how does a team change it without a deploy?

## Rules for the whole repo

1. **The repository is public.** No business reasoning, costs, competitors,
   customer names or internal plans in code, docs, commits or pull requests.
   Describe what the code does and how to change it.
2. **Nothing in production fetches a registry.** The indexer runs locally and
   writes `apps/web/data/`, and the site reads only that. The details are in
   [`apps/web/scripts/README.md`](apps/web/scripts/README.md).
3. **`views:check` guards every build.** If it fails, fix the data, never the
   guard.
4. **What goes into an `AGENTS.md` is agreed, and guarded.** Agents propose
   additions; the Documentation Engineer writes them, keeping each file short
   and free of anything a level above already says.
5. **`main` only takes changes through pull requests,** from short-lived
   branches. Make every pull request one meaningful slice, not one commit per
   tweak: each merge deploys.
6. **Every pull request into `main` runs CI** (lint, typecheck, tests, build).
   A red check never reaches review.
