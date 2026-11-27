# `packages/feedback`

The Feedback Loop for registry.directory: **Observe → Ask → Improve**. It
records what people do and what they answer, and turns that into one signal
per feature.

> **Draft.** We're still designing, and this file gets rewritten as decisions
> close. No code yet. What it does, what it doesn't, its invariants and who
> uses it are settled; the API names are a proposal.

## The loop

- **Observe:** what people do, recorded without interrupting them. For
  example, an install through `/r`.
- **Ask:** the answer to something designed on purpose, such as a thumbs up or
  an "I want this".
- **Improve:** each feature declares its loop and a threshold. The package
  reports where the loop stands, and **a person decides** what changes.

## What it doesn't do

- **Change the product.** A loop in the `decide` state is a heads-up for a
  person, never an automatic change.
- **Store personal data.** No IP addresses, raw user agents or emails.
- **Know about permissions.** The caller filters what each person may see.
  Access lives in [`packages/organizations`](../organizations).
- **Replace Vercel Analytics** on the public site.

## Proposed API

| Piece | Proposed API |
|---|---|
| Loop | `createLoop({ store })` |
| Observe | `loop.observe({ name, subject, teamId?, props? })` |
| Ask | `loop.ask({ name, answer, teamId?, props? })` |
| Signals | `loop.signals({ name, since, by? })` returns aggregates |
| State | `defineLoop({ feature, observe, ask, threshold })`, then `loop.state(feature)` returns `"note"`, `"proposal"` or `"decide"` |
| Store | An interface with `write(event)` and `aggregate(query)`. The Postgres store uses one table: `feedback_event(id, at, step, name, subject, team_id, props)`, where `step` is `observe` or `ask`, `team_id` can be null and `props` is `jsonb`. |

## Depends on and used by

- **Depends on:** a Store. Postgres is the first one.
- **Used by:** `/r` (observes installs), `apps/web` (empty-state clicks, "I
  want this" on upcoming features, Save, and the Analytics screen, which reads
  signals and state) and the MCP App (search, preview and install).

Working on this package? Read [`AGENTS.md`](AGENTS.md) first.
