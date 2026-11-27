# AGENTS.md: `packages/feedback`

What this package is and what it does live in [`README.md`](README.md). This
file is the rules for changing it.

> **Draft.** We're still designing, and this file gets rewritten as decisions
> close. No code yet. The invariants are settled.
> Don't treat the API names as a contract until code lands.

## Invariants

Never break these. If a change needs to, stop and ask.

1. **Recording never blocks or breaks the caller.** In `/r` it runs after the
   response (`after()`). If it fails, it logs and the response goes on.
2. **Events are insert-only.**
3. **No personal data in `props`:** no IP address, raw user agent or email.
4. **`team_id` is set only when the caller authenticated with that team's
   token.**
5. **Cross-team aggregates are read only with `analytics:read`**, a
   permission of the platform's Admin role, from [`packages/organizations`](../organizations).
6. **Improve is never automatic.** A person decides, from the Analytics
   screen. `ready` is a heads-up for that person, not a trigger.
7. **Portable.** The core imports no React, no Next.js and nothing from the
   app's schema. The `react` export imports only React.
8. **The package never decides the look.** Anything visible comes in as the
   team's prop. Neither `Ask` nor the team's component touches the database:
   they go through a server action.
9. **A default never needs a deploy to change.** `measure()` holds the
   defaults; changes live in data, and everything reads the effective value
   (team, then platform, then default). If a value can only change by editing
   code, that's a design error.

## Boundaries

- **Three layers, kept apart** (see the README):
  - The core has no React. Nothing outside the `react` export may import
    React.
  - `Ask` and `useAsk`, in the `react` export, bring behavior only: no
    styles, no markup of their own beyond what the `render` prop returns. The
    `answer` function they receive is their only door to the core.
  - Recipes are shadcn registry items in `registry/feedback/`, built with
    `Ask`. They never go inside this package.
- Public names say what the code does, in plain English. Observe and Ask are
  the names of the idea; in code they are `track`, `answer` and the `Ask`
  component. Don't bring back `observe`, `signals`, `state` or `defineLoop`
  as public names.
- No permission checks here. The caller decides who sees what.
- No product decisions in code. The package reports; a person decides.
