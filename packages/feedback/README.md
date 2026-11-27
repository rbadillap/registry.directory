# `packages/feedback`

The Feedback Loop for registry.directory: **Observe → Ask → Improve**. It
tracks what people do and what they answer, and tells you, feature by feature,
whether it's time to decide something.

> **Draft.** We're still designing, and this file gets rewritten as decisions
> close. No code yet. What it does, what it doesn't, its invariants and who
> uses it are settled; the exact signatures, options and the table are a
> proposal.

## Behavior, not look

The package never decides how anything looks. It brings the behavior, and the
team passes in the visual piece as a prop. That way it plugs into anyone's
design system instead of competing with it.

## Three layers

1. **The core, with no React.** `createFeedback`, `track`, `answer`,
   `measure`, `status`, `evidence` and the Store. It lives here, in
   `packages/feedback/`.
2. **One behavior component: `Ask`.** It lives in a separate `react` export
   of this package (name to be settled), so code that only needs the core
   never pulls in React. `Ask` decides whether to ask this person now, records
   the answer and feeds Analytics. The team's own component decides how it
   looks:

   ```tsx
   <Ask
     feature="inconsistencies"
     question="Did this help you fix it?"
     when={{ once: "week", stopWhen: "ready" }}
     render={Thumbs}
   />
   ```

   The team's component receives `{ question, answer(value) }` and only knows
   how it looks. Proposed options for `when`:
   - `once`: at most once per person per period;
   - `stopWhen: "ready"`: stop asking once there's enough evidence;
   - `max`: a cap on answers.
3. **Recipes, as shadcn registry items.** Complete examples of a feedback flow
   built with `Ask`. Install one with
   `npx shadcn add @registrydirectory/feedback/<item>`, read it and change it.
   The Dashboard uses these same recipes. They live in `registry/feedback/`:
   - `one-question`: the right question at the right moment;
   - `coming-next`: what's coming, with "I want this";
   - `quick-actions`: the phrase buttons of an empty state;
   - `empty-state`: an empty screen that asks instead of sitting blank.

## The loop, and its names in code

| Idea | In code | What it is |
|---|---|---|
| Observe | `feedback.track` | What people do, recorded without interrupting them. For example, an install through `/r`. |
| Ask | `feedback.answer`, and the `Ask` component | The answer to something designed on purpose, such as a thumbs up or an "I want this". |
| Improve | `measure`, `feedback.status` and `feedback.evidence` | Each feature declares what it tracks, what it asks and its goal. `status` says where it stands: `watching`, `promising` or `ready`. **A person decides** what changes. |

## What it doesn't do

- **Decide how anything looks.** The visible part is always the team's.
- **Change the product.** A feature in `ready` is a heads-up for a person,
  never an automatic change.
- **Store personal data.** No IP addresses, raw user agents or emails.
- **Know about permissions.** The caller filters what each person may see.
  Access lives in [`packages/organizations`](../organizations).
- **Replace Vercel Analytics** on the public site.

## Core API (proposal)

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
