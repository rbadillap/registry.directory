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

- **`README.md` is for people.** What it is, a visual when it helps
  understanding, and a basic guide to get going.
- **`AGENTS.md` is for agents.** The rules for changing that part: its
  invariants and its boundaries. It doesn't repeat what a level above already
  says.

Each level documents only itself and links down. Don't add a `CLAUDE.md`:
Claude Code reads `AGENTS.md` directly, and a `CLAUDE.md` would make it skip
this file.

| Path | What its `AGENTS.md` covers |
|---|---|
| `/` (this file) | The stack, the commands and the rules for the whole repo |
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
