# `packages/feedback`

The Feedback Loop for registry.directory: **Observe → Ask → Improve**. It
records what people do and what they answer, and turns that into one signal
per feature.

> **Draft.** We're still designing, and this file gets rewritten as decisions
> close. No code yet. What it does, what it doesn't, its invariants and who
> uses it are settled; the API names are a proposal.

## Two layers

- **The core, with no UI.** `observe`, `ask`, `signals`, `state` and the
  Store. It lives here, in `packages/feedback/`, and ships no components.
- **The kit: default components, as shadcn registry items.** Install them
  with `npx shadcn add @registrydirectory/feedback/<item>`; once installed,
  the code is yours to edit. They live in `registry/feedback/`, never inside
  the core:
  - `thumbs`: a thumbs-up question;
  - `coming-next`: what's coming, with "I want this";
  - `quick-actions`: the phrase buttons of an empty state;
  - `one-question`: the right question at the right moment.

  A kit component never touches the database and never imports the core on
  the client. It calls a server action or a route, and that calls
  `loop.ask` or `loop.observe`. The component is the face; the core stores.
  The Dashboard uses this same kit.

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
