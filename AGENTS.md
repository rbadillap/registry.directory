# AGENTS.md

Rules for agents working in this repository. What the project is, and how a
person gets started, lives in [`README.md`](README.md).

> **Draft.** The Dashboard is being designed on the `dev` branch, and this
> file gets rewritten as decisions close.

## Stack

- **Monorepo:** Turborepo and pnpm workspaces (`apps/*`, `packages/*`).
  pnpm 10, Node 24.
- **Site:** `apps/web`, Next.js 15 (App Router), React 19, TypeScript.
- **UI:** Tailwind CSS v4 and shadcn/ui, with the shared components in
  `packages/ui` (Radix underneath).
- **Secrets:** Varlock, from `apps/web/.env.schema`. Nothing secret is needed
  to run the site locally.
- **Hosting:** Vercel, with Vercel Blob for submissions.
- **Planned for the Dashboard** (on `dev`, not in production yet): Postgres on
  Neon through Drizzle, and Auth0 for identity only. See
  [`packages/organizations`](packages/organizations) and
  [`packages/feedback`](packages/feedback).

## Architecture of the Dashboard (on `dev`)

The Dashboard is the design system layer for a team: it sits between a team
and its design system, and between its agents and its rules.

- **Three faces over one API,** authenticated with tokens: the web
  (`/dashboard`), an **MCP App** inside Claude, and `/r` for the shadcn CLI.
- **The web is where you manage; the MCP App is where you work.** First the
  MCP App supports Claude only: search, preview, install, see inconsistencies
  in the local repo, read the rules, preview a preset and save to the team.
  For anything administrative it links to the exact web screen. Later it
  offers more tools by role, filtered with `can()` on the connected token.
- **`/r` hosts each team's items.** It no longer proxies public registries.
- **Build order:** `/r` counts everything that passes through it; then "Find
  me a component" in the MCP App, without an account; then Save to team, where
  the account and the Overview begin. After that: Inconsistencies, Brand
  presets and Agent rules. What isn't built yet shows as Coming next, and its
  clicks help decide what moves up.

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
- A team gets a default Brand preset, and can add and extend its own.

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
5. **`dev` only takes changes through pull requests.** No direct pushes, no
   force pushes, no deleting the branch. Each merge to `dev` deploys it, so
   make every pull request one meaningful slice, not one commit per tweak.
   `main` also changes only through pull requests.
