# `packages/feedback`

The Feedback Loop for registry.directory: **Observe → Ask → Improve**. It
tracks what people do and what they answer, and tells you, feature by feature,
whether it's time to decide something.

> **Draft.** We're still designing, and this file gets rewritten as decisions
> close. No code yet. What it does, what it doesn't, its invariants and who
> uses it are settled; the exact signatures and the table are a proposal.

## Two layers

- **The core, with no UI.** `createFeedback`, `track`, `answer`, `measure`,
  `status` and the Store. It lives here, in `packages/feedback/`, and ships no
  components.
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
  `feedback.answer` or `feedback.track`. The component is the face; the core
  stores. The Dashboard uses this same kit.

## The loop, and its names in code

| Idea | In code | What it is |
|---|---|---|
| Observe | `feedback.track` | What people do, recorded without interrupting them. For example, an install through `/r`. |
| Ask | `feedback.answer` | The answer to something designed on purpose, such as a thumbs up or an "I want this". |
| Improve | `measure` and `feedback.status` | Each feature declares what it tracks, what it asks and its goal. `status` says where it stands: `watching`, `promising` or `ready`. **A person decides** what changes. |

## What it doesn't do

- **Change the product.** A feature in `ready` is a heads-up for a person,
  never an automatic change.
- **Store personal data.** No IP addresses, raw user agents or emails.
- **Know about permissions.** The caller filters what each person may see.
  Access lives in [`packages/organizations`](../organizations).
- **Replace Vercel Analytics** on the public site.

## API (proposal)

```ts
const feedback = createFeedback({ store })

feedback.track(name, { subject, teamId, props })
feedback.answer(name, answer, { subject, teamId })

measure(feature, { question, track, answer, goal })
feedback.status(feature)   // "watching" | "promising" | "ready"
feedback.evidence(feature) // the dated weeks behind that status
```

- The Analytics screen reads `status`, and `evidence` when a person opens a
  feature in `ready` before deciding. There is no public API for raw
  aggregates.
- The app keeps one `measure()` per feature of the map, in
  `apps/web/feedback/features/`.
- **Store:** an interface with `write(event)` and `aggregate(query)`. The
  Postgres store uses one table: `feedback_event(id, at, kind, name, subject,
  team_id, props)`, where `kind` is `track` or `answer`, `team_id` can be null
  and `props` is `jsonb`.

## Depends on and used by

- **Depends on:** a Store. Postgres is the first one.
- **Used by:** `/r` (tracks installs), `apps/web` (empty-state clicks, "I
  want this" on upcoming features, Save to team, and the Analytics screen,
  which reads status) and the MCP App (search, preview and install).

Working on this package? Read [`AGENTS.md`](AGENTS.md) first.
