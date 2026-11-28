# `packages/organizations`

Teams and access for the registry.directory Dashboard. It answers one question
everywhere it's asked: **can this identity do this to this resource?**

> **Draft.** We're still designing, and this file gets rewritten as decisions
> close. No code yet: the examples show the intended API.

It plugs into your design system; it doesn't compete with it. The core has no
React, so `/r`, the MCP App and scripts use it directly. Behavior components
live in `@workspace/organizations/react`, and ready-made recipes install from
the registry.

## Checking a permission

Everything goes through one check. `can()` answers yes or no:

```ts
import { can } from "@workspace/organizations"

if (await can(identity, "presets:write", team)) {
  // show the "New preset" button
}
```

`requireCan()` is the same check, but it stops the request when the answer is
no. Use it at the top of a route or a server action:

```ts
import { requireCan } from "@workspace/organizations"

export async function createPresetAction(input: PresetInput) {
  await requireCan(identity, "presets:write", team)
  // only reached when allowed
}
```

The `identity` comes from your auth adapter (Auth0 today). This package never
signs anyone in; it only decides what that identity may do.

Both checks deny by default: an unknown permission, no identity, no membership
or a database error all mean no, and every denial is recorded.

## Teams and their roles

Creating a team gives it an automatic, neutral handle and its three system
roles:

```ts
import { createTeam, listRoles } from "@workspace/organizations"

const team = await createTeam(userId)
team.handle // "team-7k3m9q"

await listRoles(team.id)
// [ { name: "Owner",  system: true },
//   { name: "Member", system: true },
//   { name: "Viewer", system: true } ]
```

The creator becomes the Owner. A team can take its own handle later:

```ts
await renameHandle(team.id, "acme")
await resolveHandle("acme") // team.id, and old handles keep resolving as aliases
```

People join through an invitation link (email can come later), and get a role
when they join. It can change:

```ts
await addMember(team.id, userId, "Member")
await setRole(team.id, userId, "Viewer")
await removeMember(team.id, userId)
```

### What each system role can do

| Permission | Owner | Member | Viewer |
|---|:---:|:---:|:---:|
| `items:read` | ✓ | ✓ | ✓ |
| `items:save`, `items:mark` | ✓ | ✓ | |
| `rules:read`, `rules:write` | ✓ | ✓ | |
| `activity:read` | ✓ | ✓ | |
| `presets:write` | ✓ | | |
| `members:manage` | ✓ | | |
| `tokens:manage` | ✓ | | |
| `settings:write` | ✓ | | |
| `feedback:configure` | ✓ | | |

`feedback:configure` lets a team change how often its people are asked
questions, or turn them off. It's separate from `settings:write` so a custom
role can grant it without granting all of Settings.

A Viewer sees and installs what the team has, for example to prepare a demo
with a client's brand. Owner can't be edited or deleted and always holds every
team permission. Member and Viewer can't be deleted.

## Custom roles

Permissions are a fixed list in the code; roles are data. That's why a team
can build its own roles, and `can()` treats them exactly like the system ones.
Custom roles come later, with their own screen:

```ts
await createRole(team.id, {
  name: "Manager",
  permissions: ["members:manage", "tokens:manage", "presets:write", "items:read"],
})
```

Two limits always hold. A custom role can only hold team permissions, never
platform ones. And nobody can put a permission in a role, or give a role to
someone, if they don't hold that permission themselves.

## Tokens

The CLI authenticates with a token, one per person. A token carries scopes,
and those scopes can never be more than its creator's permissions. When an
install is counted, only the team is kept, never the token or the person:

```ts
const { token, secret } = await createToken(team.id, ["items:read"], expiresAt)
// `secret` is shown once and stored hashed. Copy it now.

await revokeToken(token.id)
```

The team puts the secret in its `components.json`:

```json
{
  "registries": {
    "@registrydirectory": {
      "url": "https://registry.directory/r/{name}.json",
      "headers": { "Authorization": "Bearer ${REGISTRY_TOKEN}" }
    }
  }
}
```

## Installing a private component

When someone runs this:

```bash
npx shadcn add @registrydirectory/acme/button
```

`/r` checks it like this:

```ts
const identity = await verifyToken(secret)            // whose token, which team
const teamId = await resolveHandle("acme")            // which team owns the item
await requireCan(identity, "items:read", { teamId })  // may they read it?
// then the item is read through row-level security
```

And there are three possible answers:

```http
HTTP/1.1 200 OK
```

The item, when the token belongs to a member of `acme` who holds `items:read`.

```http
HTTP/1.1 403 Forbidden

{ "message": "You can't install private components from acme. Ask an Owner of acme for access.",
  "permission": "items:read" }
```

A member of `acme` without the permission. The shadcn CLI shows the `message`
to the person, so it names the action and who to ask, never the technical
permission. That one goes in its own field, for debugging.

```http
HTTP/1.1 404 Not Found
```

No token, a token from another team, or not a member. It answers as if `acme`
didn't exist, so nobody can find out which teams are there.

Even if the app got the check wrong, the database wouldn't return another
team's rows: row-level security is the second guard.

## Behavior components

Components in `@workspace/organizations/react` bring the behavior and leave
the look to you. You pass your own component as a prop:

```tsx
import { TeamSwitcher } from "@workspace/organizations/react"

<TeamSwitcher render={MyMenu} />

function MyMenu({ teams, current, switchTo }) {
  return (
    <DropdownMenu>
      {teams.map((t) => (
        <DropdownMenuItem key={t.id} onSelect={() => switchTo(t.id)}>
          {t.handle}
        </DropdownMenuItem>
      ))}
    </DropdownMenu>
  )
}
```

`TeamSwitcher` knows which teams you belong to, switches between them and
respects permissions. It has no styles of its own.

## Recipes

If you'd rather start from something finished, install a recipe and make it
yours:

```bash
npx shadcn add @registrydirectory/organizations/team-switcher
```

The recipes are the team switcher, the member list, the create-token dialog,
the activity log and the "you don't have permission" message. The Dashboard
uses these same recipes.

## The platform Admin

Platform permissions (`submissions:review`, `origins:read`, `home:edit`,
`analytics:read` and `feedback:manage`, which covers feedback goals and
wording) belong to one role, Admin, which belongs to the platform and
not to any team. No team Owner can grant it; only another Admin or a database
migration can, and the platform is never left without one.

## What it doesn't do

- **Sign people in.** Identity comes from an adapter.
- **Serve `/r`.** It verifies the token; `/r` serves the item.
- **Record product events.** That is [`packages/feedback`](../feedback).

## Depends on and used by

- **Depends on:** Postgres (Neon) through Drizzle, and an identity adapter
  (Auth0).
- **Used by:** `apps/web`, `/r` and the MCP App server. Later, the MCP App
  will also use `can()` on the connected token to decide which tools to offer.

Working on this package? Read [`AGENTS.md`](AGENTS.md) first.
