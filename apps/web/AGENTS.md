# AGENTS.md: `apps/web`

The site: the public directory, `/r` and, behind `DASHBOARD_ENABLED`, the
Dashboard. The stack,
the commands and the rules for the whole repo are in the
[root `AGENTS.md`](../../AGENTS.md); the indexer and its guard are in
[`scripts/README.md`](scripts/README.md).

> **Draft.** The Dashboard is being built on `main` behind
> `DASHBOARD_ENABLED`, off in production and on in the `dev` environment. This
> file gets rewritten as decisions close.

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
- **Until the cut-over,** a team handle can't be a directory key, and the
  indexer refuses a new registry whose key is a team's handle. See invariant 8
  in [`packages/organizations`](../../packages/organizations/AGENTS.md).
- A team handle the visitor can't access answers 404, never 403, both in
  `/dashboard/{handle}` and in `/r/{handle}/...`. See
  [`packages/organizations`](../../packages/organizations/AGENTS.md).

## `/r`

With `DASHBOARD_ENABLED` off, as in production today, `/r` works as it does
now. With the flag on, the new `/r` and the current one live side by side
until the cut-over:

- the new `/r` serves team handles, our packages and our own catalog;
- everything else falls through to the current behavior until the cut-over,
  which is part of the launch plan;
- meanwhile, team handles and directory keys can't overlap (see Routes).

After the cut-over, `/r` only hosts our own items and stops proxying public
registries.

- **Where a team's items come from:** our database. A team's brand is a
  DESIGN.md, and it gives the team two private items: `theme`, the brand as
  shadcn variables (`registry:theme`), and `design`, the DESIGN.md itself for
  agents (`registry:file`). Nothing lives outside us, so private is real from
  the first version.
- **Names:** one namespace per team, shared by every item:
  `@registrydirectory/acme/theme`, `@registrydirectory/acme/design`. Each name
  is unique within the team, and the Dashboard warns when saving. What an item
  is comes from shadcn's `type` field, never from its name; `theme` and
  `design` are suggested names, not rules. Our own recipes are
  `@registrydirectory/{package}/{item}`.
- **Tokens:** one per person. Counting keeps only the team, never the token or
  the person.
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
- **The brand is validated before it's saved** with `@google/design.md`
  (tokens and WCAG contrast), which also exports the shadcn variables.

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
| Overview | "What are we using?" | One block per section: dashed with a quick action until it's set up, solid once it is |
| Brand | "This is our look" | The team's brand as a DESIGN.md: created here, started from a shadcn preset, or imported. Previewed on base components (button, card, input, badge) |
| Items | | The team's items: type (component, theme, design file), where it comes from, and how many times it's installed. Later: Inconsistencies, Free catalog |
| Agent rules | "Teach my agent" | The rules Claude follows in the team's projects |
| Connect | | Connecting Claude to the team: **Connect agent** in the MCP App, **Connect project** in the CLI |
| Activity | | Who did what |
| Members | | Who's in, invitations by link, and each person's role |
| Settings | | Tokens, Custom handle |
| Admin › Analytics | | Platform only: where a person decides each Improve |

- Navigation names say what's inside, never how it's built. Not "Inventory",
  "Private registry" or "Tenant themes". A theme and a design file are items
  too, so the section is "Items", not "Components".
- No notification center in the first version.
- **Handles in onboarding:** signing in creates the team with an automatic,
  neutral handle (`team-7k3m9q`), with no extra step. Settings › Custom handle
  offers a real one when it matters, such as on the first token. It can change
  freely until the first private item is published; after that, the old
  handle stays as an alias.
- After the first counted install, the Dashboard asks once, with `Ask`: "Did
  your brand look the way you expected?"

## The Overview and what isn't built yet

- Each section is one block in the Overview: dashed with a quick action until
  it's set up, solid once it is. Day one is all dashed blocks.
- **Coming next** shows what doesn't exist yet, apart and greyed out: one line
  on what it will do and an "I want this" button. Never the word "soon", no
  email, no dates. When tapped, it answers "Noted. Thanks." and the click is
  recorded with [`packages/feedback`](../../packages/feedback).
- Every section says how we'll know it works for the person, measured without
  storing anything that identifies them, and its signal lives in Admin ›
  Analytics. A section without its signal isn't ready to ship.

## The MCP App

It's where people work; anything administrative links to the exact web screen
("Invite teammates →" opens Members). Claude first. This section moves to the
MCP App's own folder once it has one.

- **Connecting:** Claude connects with OAuth, with Auth0 as the authorization
  server, and the MCP App knows the team from that session.
- **Agent rules** reach Claude through an MCP App tool.
- **Finding items:** a person asks in their own words, and the app answers with
  a card that shows the team's own items first. One primary button, Install:
  in the Code tab Claude runs the shadcn command; in a regular chat the person
  copies it. A brand picker talks like a person ("Brand: Acme ▾"), never with
  preset handles, and a grey "Won't follow your brand" marks a component that
  ignores the preset.
- After installing, one question with `Ask`: "Did it fit what you needed?"
- Previews are images generated when indexing, never a live render of someone
  else's code. A search's events are joined by a random id that dies with the
  search.
