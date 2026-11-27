# AGENTS.md: `apps/web`

The site: the public directory, `/r` and, on `dev`, the Dashboard. The stack,
the commands and the rules for the whole repo are in the
[root `AGENTS.md`](../../AGENTS.md); the indexer and its guard are in
[`scripts/README.md`](scripts/README.md).

> **Draft.** The Dashboard is being designed on `dev`, and this file gets
> rewritten as decisions close. Production doesn't have any of the Dashboard
> yet.

## Routes

- The Dashboard lives in this same Next.js app, under one segment:
  `/dashboard/{handle}/...` for a team and `/dashboard/admin/...` for the
  platform. Sign-in goes under `/api/auth`.
- Registry pages live at the root (`/{owner}`), so every fixed root folder
  hides a registry with the same key. Keep root routes to a short **reserved
  list**: `dashboard`, `api`, `r`, the site's own pages (`about`, `docs`…) and
  the name of every package of ours (`feedback`, `organizations`…).
- The reserved list is checked in two places: submit rejects a reserved
  namespace with a clear message, and the indexer refuses to publish one. If a
  clash ever happens, reject the slug; never leave a registry without its page.
- A team handle the visitor can't access answers 404, never 403, both in
  `/dashboard/{handle}` and in `/r/{handle}/...`. See
  [`packages/organizations`](../../packages/organizations/AGENTS.md).

## `/r`

On `dev`, `/r` is the registry that hosts each team's items. It doesn't proxy
public registries.

- **Names:** `@registrydirectory/{handle}/{item}` for a team's components and
  presets, and `@registrydirectory/{package}/{item}` for our own recipes.
- **Auth:** one header, `Authorization: Bearer ${REGISTRY_TOKEN}`. The URL says
  whose item it is; the token only says whether you may pass. Public items
  need no token.
- **Everything that passes through `/r` is counted,** so item responses go
  through the function, never the CDN. Only the index of our own catalog and
  its search stay on the CDN.
- **Private items are never cached** in the CDN or any shared cache:
  `Cache-Control: private, no-store`, because the answer depends on the token.
- **Record the install after responding,** with `after()`. Recording never
  makes the CLI wait and never breaks the response.
- The Runtime Cache, if used, only saves a database read. It's an
  optimization, not a rule.
- An environment variable sends public items back to the CDN if cost demands
  it.
- **Presets** are `registry:theme` items with their own handle
  (`acme/brand`, `acme/brand-dark`). A preset can extend another and overrides
  only the CSS variables that change; one is the team's default.

## The Dashboard reads from the API

Everything the Dashboard shows comes from the same API that the MCP App and
`/r` use, never from components reading the database directly. That keeps the
three faces reusing one source.

## Names in the interface

Every feature has two names. A short noun for the sidebar, and a phrase, what
a person would say, for the MCP App, empty states and Quick actions. Interfaces
are in English.

| Sidebar | Phrase | What it is |
|---|---|---|
| Overview | "What are we using?" | The team's home, fed by what `/r` serves to the team |
| Components | "Find me a component" | Filters: Saved, Ours, Inconsistencies ("What doesn't match?") |
| Brand | "This is our look" | The team's presets, and "Show it as a client" to preview another one |
| Agent rules | "Teach my agent" | Written on the web, read by the agent in the MCP App |
| Settings | | Invite, Roles, Tokens, Custom handle, Activity |
| Admin › Analytics | | Platform only: where a person decides each Improve |

- Navigation names say what's inside, never how it's built. Not "Inventory",
  "Private registry" or "Tenant themes".
- **Save to team** is a button next to any component, not a section. Without
  an account it leads to sign-in and comes back already saved. Toast: "Saved
  to your team".
- Connecting with a token is **Connect project** in the CLI and **Connect
  agent** in the MCP App.
- No notification center in the first version.
- **Overview** sees what the team installs from its own registry and from our
  catalog. What a team saves from the directory and then installs goes
  straight to the origin, so Overview never shows it.
- **Inconsistencies** is read locally by the agent, in the MCP App. A GitHub
  App comes later, on the web.
- **Handles in onboarding:** a team is born on its first Save with an automatic,
  neutral handle (`team-7k3m9q`), with no extra step. Settings › Custom handle
  offers a real one when it matters: on the first token or the first Ours
  component. It can change freely until the first private item is published;
  after that, the old handle stays as an alias.
- **Presets** can also be exported as a shadcn `--preset` code, as an option.

## The MCP App, stage 1

Claude only. It's where people work; anything administrative links to the
exact web screen ("Invite teammates →" opens Settings › Invite). This section
moves to the MCP App's own folder once it has one.

A person asks in their own words ("a pricing section that looks like our
brand"), and the app answers with a card, not text:

1. **The team's own first.** If the team already has a component that fits, it
   leads as a large preview ("Your team already uses this in 3 repos").
2. **One primary button, Install.** Save to team and the rest go in a "…"
   menu. Claude runs the install with the shadcn command.
3. **Alternatives** as a small gallery below.
4. **A brand picker that talks like a person:** "Brand: Acme ▾", with "Acme"
   and "Globex (client)", never preset handles.
5. **"Won't follow your brand"** in a grey line when a component ignores the
   preset (hardcoded colors).
6. **One question after installing,** with `Ask`: "Did it fit what you
   needed?", at most once a week, and never once the feature is `ready`.

Tools (proposal): `find_components`, `preview_component`,
`install_component`, `save_to_team` (opens sign-in when there's no account)
and `want_this`. Inconsistencies and Agent rules join when they leave Coming
next. Every call is recorded with `feedback.track`.

Previews are images generated when indexing, never a live render of someone
else's code.

## The empty state

The first screen is "What do you need today?", on the web and in the MCP App,
with the same phrases (the MCP App may show fewer).

- **Quick actions** show only what works today.
- **Coming next** shows what doesn't exist yet, apart and greyed out: one line
  on what it will do and an "I want this" button. Never the word "soon", no
  email, no dates. When tapped, it answers "Noted. Thanks." and the click is
  recorded with [`packages/feedback`](../../packages/feedback).
- Every feature on the web has its signal in Admin › Analytics. A feature
  without its signal isn't ready to ship.
