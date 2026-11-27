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
5. **Cross-team aggregates are read only with `analytics:read`**, a platform
   permission from [`packages/organizations`](../organizations).
6. **Improve is never automatic.** A person decides, from the Analytics
   screen. `ready` is a heads-up for that person, not a trigger.
7. **Portable.** No imports from Next.js or from the app's schema.

## Boundaries

- The core has no UI. Kit components are shadcn registry items in
  `registry/feedback/`, never inside this package.
- Kit components never touch the database or import the core on the client.
  They call a server action or a route, which calls `feedback.answer` or
  `feedback.track`.
- Public names say what the code does, in plain English. Observe and Ask are
  the names of the idea; in code they are `track` and `answer`. Don't bring
  back `observe`, `ask`, `signals`, `state` or `defineLoop` as public names.
- No permission checks here. The caller decides who sees what.
- No product decisions in code. The package reports; a person decides.
