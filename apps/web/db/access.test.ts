// Sign-in creates the team and its Owner; can() answers from the database;
// row-level security keeps each team's rows to its members even if the app
// gets a check wrong. Everything runs as app_user, the role the app uses.
//
// Run with: pnpm test

import { strict as assert } from "node:assert"
import { after, before, describe, it } from "node:test"
import type { PGlite, Transaction } from "@electric-sql/pglite"
import { AccessDenied, AUTOMATIC_HANDLE, createOrganizations, type Database } from "@workspace/organizations"
import { testDatabase } from "./test-db.ts"

let db: PGlite
let app: Database
const silent = () => {}

// Every query as app_user, the way the app connects.
function asApp(pg: PGlite): Database {
  return {
    query: (text, params) =>
      pg.transaction(async (tx) => {
        await tx.exec("set local role app_user")
        return tx.query(text, params)
      }),
  } as Database
}

// A transaction as app_user with a signed-in person, the way policies see it.
function asUser<T>(userId: string | null, fn: (tx: Transaction) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.exec("set local role app_user")
    if (userId) await tx.query("select set_config('app.user_id', $1, true)", [userId])
    return fn(tx)
  })
}

async function rejects(promise: Promise<unknown>, pattern: RegExp) {
  await assert.rejects(promise, (error: Error) => pattern.test(error.message))
}

before(async () => {
  db = await testDatabase({ firstAdmin: "auth0|first-admin" })
  app = asApp(db)
})
after(() => db.close())

describe("signIn", () => {
  it("creates the person, their team with an automatic handle, the system roles and the Owner", async () => {
    const orgs = createOrganizations({ db: app, log: silent })
    const first = await orgs.signIn("auth0|alice")
    assert.equal(first.teamCreated, true)
    assert.match(first.handle, AUTOMATIC_HANDLE)

    const { rows: roles } = await db.query<{ name: string; system: boolean }>(
      "select name, system from organizations.roles where team_id = $1 order by name",
      [first.teamId]
    )
    assert.deepEqual(roles, [
      { name: "Member", system: true },
      { name: "Owner", system: true },
      { name: "Viewer", system: true },
    ])

    const { rows: members } = await db.query<{ role: string; subject: string }>(
      `select r.name as role, u.auth0_subject as subject
       from organizations.members m
       join organizations.roles r on r.id = m.role_id
       join organizations.users u on u.id = m.user_id
       where m.team_id = $1`,
      [first.teamId]
    )
    assert.deepEqual(members, [{ role: "Owner", subject: "auth0|alice" }])

    const again = await orgs.signIn("auth0|alice")
    assert.deepEqual(again, { ...first, teamCreated: false })
  })

  it("never proposes a directory key or a reserved name as the handle", async () => {
    const orgs = createOrganizations({ db: app, log: silent })
    const result = await orgs.signIn("auth0|bob", { directoryKeys: new Set(["efferd"]) })
    assert.match(result.handle, AUTOMATIC_HANDLE)
  })

  it("is refused by the database for a reserved or malformed handle", async () => {
    await rejects(asUser(null, (tx) => tx.query("select organizations.sign_in('auth0|x', 'dashboard')")), /handle_check/)
    await rejects(asUser(null, (tx) => tx.query("select organizations.sign_in('auth0|y', 'Team-A')")), /handle_check/)
  })

  it("finds the first Admin, granted before they ever signed in", async () => {
    const orgs = createOrganizations({ db: app, log: silent })
    const admin = await orgs.signIn("auth0|first-admin")
    assert.equal(admin.teamCreated, true)
    assert.equal(await orgs.can({ kind: "user", userId: admin.userId }, "analytics:read"), true)
  })
})

describe("can", () => {
  it("resolves role → permissions from the database for Owner, Member and Viewer", async () => {
    const orgs = createOrganizations({ db: app, log: silent })
    const owner = await orgs.signIn("auth0|carol")
    const member = await orgs.signIn("auth0|dave")
    const viewer = await orgs.signIn("auth0|erin")

    // Move dave and erin into carol's team (Members management comes later).
    for (const [person, role] of [[member, "Member"], [viewer, "Viewer"]] as const) {
      await db.query(
        `insert into organizations.members (team_id, user_id, role_id, created_by)
         select $1, $2, id, $3 from organizations.roles where team_id = $1 and name = $4`,
        [owner.teamId, person.userId, owner.userId, role]
      )
    }

    const team = { teamId: owner.teamId, handle: owner.handle }
    const id = (r: { userId: string }) => ({ kind: "user" as const, userId: r.userId })

    assert.equal(await orgs.can(id(owner), "presets:write", team), true)
    assert.equal(await orgs.can(id(owner), "tokens:manage", team), true)
    assert.equal(await orgs.can(id(member), "items:save", team), true)
    assert.equal(await orgs.can(id(member), "presets:write", team), false)
    assert.equal(await orgs.can(id(viewer), "items:read", team), true)
    assert.equal(await orgs.can(id(viewer), "items:save", team), false)
  })

  it("denies by default: no identity, unknown permission, no team, not a member, a platform permission", async () => {
    const orgs = createOrganizations({ db: app, log: silent })
    const a = await orgs.signIn("auth0|frank")
    const b = await orgs.signIn("auth0|grace")
    const frank = { kind: "user" as const, userId: a.userId }

    assert.equal(await orgs.can(null, "items:read", { teamId: a.teamId }), false)
    assert.equal(await orgs.can(frank, "items:delete-everything", { teamId: a.teamId }), false)
    assert.equal(await orgs.can(frank, "items:read"), false)
    assert.equal(await orgs.can(frank, "items:read", { teamId: b.teamId }), false)
    assert.equal(await orgs.can(frank, "analytics:read"), false)
  })

  it("denies when the database fails", async () => {
    const broken: Database = { query: async () => { throw new Error("connection refused") } }
    const orgs = createOrganizations({ db: broken, log: silent })
    assert.equal(await orgs.can({ kind: "user", userId: crypto.randomUUID() }, "items:read", { teamId: crypto.randomUUID() }), false)
  })

  it("lets a token do only what its scopes say, in its own team, and never more than its creator", async () => {
    const orgs = createOrganizations({ db: app, log: silent })
    const owner = await orgs.signIn("auth0|heidi")
    const other = await orgs.signIn("auth0|ivan")
    const token = {
      kind: "token" as const,
      tokenId: crypto.randomUUID(),
      teamId: owner.teamId,
      createdBy: owner.userId,
      scopes: ["items:read"] as const,
    }
    assert.equal(await orgs.can(token, "items:read", { teamId: owner.teamId }), true)
    assert.equal(await orgs.can(token, "presets:write", { teamId: owner.teamId }), false)
    assert.equal(await orgs.can(token, "items:read", { teamId: other.teamId }), false)
    assert.equal(await orgs.can(token, "analytics:read"), false)

    const fromStranger = { ...token, createdBy: other.userId }
    assert.equal(await orgs.can(fromStranger, "items:read", { teamId: owner.teamId }), false)
  })
})

describe("requireCan", () => {
  it("answers 404 to a non-member and 403 with a readable message to a member", async () => {
    const orgs = createOrganizations({ db: app, log: silent })
    const owner = await orgs.signIn("auth0|judy")
    const viewer = await orgs.signIn("auth0|ken")
    await db.query(
      `insert into organizations.members (team_id, user_id, role_id, created_by)
       select $1, $2, id, $3 from organizations.roles where team_id = $1 and name = 'Viewer'`,
      [owner.teamId, viewer.userId, owner.userId]
    )
    const team = { teamId: owner.teamId, handle: "acme" }
    const stranger = await orgs.signIn("auth0|leo")

    await assert.rejects(orgs.requireCan({ kind: "user", userId: stranger.userId }, "items:read", team), (e: AccessDenied) => {
      assert.equal(e.status, 404)
      assert.deepEqual(e.toJSON(), { message: "Not found." })
      return true
    })

    await assert.rejects(orgs.requireCan({ kind: "user", userId: viewer.userId }, "tokens:manage", team), (e: AccessDenied) => {
      assert.equal(e.status, 403)
      assert.deepEqual(e.toJSON(), {
        message: "You can't create tokens for acme. Ask an Owner of acme for access.",
        permission: "tokens:manage",
      })
      return true
    })

    await orgs.requireCan({ kind: "user", userId: owner.userId }, "tokens:manage", team)

    const { rows } = await db.query<{ n: number }>(
      "select count(*)::int as n from organizations.audit_log where action = 'denied' and team_id = $1",
      [owner.teamId]
    )
    assert.equal(rows[0]?.n, 2)
  })
})

describe("row-level security", () => {
  it("shows a person only their own team, its roles and its members", async () => {
    const orgs = createOrganizations({ db: app, log: silent })
    const mine = await orgs.signIn("auth0|mallory")
    await orgs.signIn("auth0|niaj")

    await asUser(mine.userId, async (tx) => {
      const teams = await tx.query<{ id: string }>("select id from organizations.teams")
      assert.deepEqual(teams.rows.map((r) => r.id), [mine.teamId])
      const roles = await tx.query<{ team_id: string }>("select distinct team_id from organizations.roles")
      assert.deepEqual(roles.rows.map((r) => r.team_id), [mine.teamId])
      const users = await tx.query<{ id: string }>("select id from organizations.users")
      assert.deepEqual(users.rows.map((r) => r.id), [mine.userId])
    })

    await asUser(null, async (tx) => {
      const teams = await tx.query("select id from organizations.teams")
      assert.equal(teams.rows.length, 0)
    })
  })

  it("doesn't let the app write teams, roles or members directly, or make anyone Admin", async () => {
    const orgs = createOrganizations({ db: app, log: silent })
    const me = await orgs.signIn("auth0|olivia")
    await rejects(
      asUser(me.userId, (tx) => tx.query("insert into organizations.teams (handle, created_by) values ('mine', $1)", [me.userId])),
      /permission denied/
    )
    await rejects(
      asUser(me.userId, (tx) => tx.query("insert into organizations.platform_admins (user_id) values ($1)", [me.userId])),
      /permission denied/
    )
    await rejects(
      asUser(me.userId, (tx) => tx.query("update organizations.members set role_id = role_id")),
      /permission denied/
    )
  })

  it("lets members read their team's brand and only preset writers save it", async () => {
    const orgs = createOrganizations({ db: app, log: silent })
    const owner = await orgs.signIn("auth0|peggy")
    const stranger = await orgs.signIn("auth0|quentin")
    const insert = (tx: Transaction, teamId: string, by: string) =>
      tx.query(
        "insert into dashboard.brands (team_id, design_md, light_theme, created_by) values ($1, '# Brand', '{}', $2)",
        [teamId, by]
      )

    await asUser(owner.userId, (tx) => insert(tx, owner.teamId, owner.userId))
    await rejects(asUser(stranger.userId, (tx) => insert(tx, owner.teamId, stranger.userId)), /row-level security/)

    const seen = await asUser(stranger.userId, (tx) => tx.query("select id from dashboard.brands where team_id = $1", [owner.teamId]))
    assert.equal(seen.rows.length, 0)
  })

  it("keeps feedback events insert-only and to the caller's own team", async () => {
    const orgs = createOrganizations({ db: app, log: silent })
    const me = await orgs.signIn("auth0|rupert")
    const other = await orgs.signIn("auth0|sybil")
    const insert = (tx: Transaction, teamId: string | null) =>
      tx.query("insert into feedback.events (team_id, kind, name) values ($1, 'track', 'brand_saved')", [teamId])

    await asUser(me.userId, (tx) => insert(tx, me.teamId))
    await asUser(null, (tx) => insert(tx, null))
    await rejects(asUser(me.userId, (tx) => insert(tx, other.teamId)), /row-level security/)

    // /r: a token request sets the token's team, with nobody signed in.
    await asUser(null, async (tx) => {
      await tx.query("select set_config('app.token_team_id', $1, true)", [other.teamId])
      await insert(tx, other.teamId)
    })

    await rejects(asUser(me.userId, (tx) => tx.query("update feedback.events set name = 'x'")), /permission denied/)
    await rejects(asUser(me.userId, (tx) => tx.query("delete from feedback.events")), /permission denied/)
    await rejects(db.query("delete from feedback.events"), /insert-only/)
  })
})

describe("guards", () => {
  it("keeps the system roles and the Owner's permissions, and at least one Owner", async () => {
    const orgs = createOrganizations({ db: app, log: silent })
    const team = await orgs.signIn("auth0|trent")

    // Even the owner role of the database can't break these.
    await rejects(db.query("delete from organizations.roles where team_id = $1 and name = 'Viewer'", [team.teamId]), /can't be deleted/)
    await rejects(db.query("update organizations.roles set name = 'Boss' where team_id = $1 and name = 'Owner'", [team.teamId]), /can't be renamed/)
    await rejects(
      db.query(
        `delete from organizations.role_permissions rp using organizations.roles r
         where r.id = rp.role_id and r.team_id = $1 and r.name = 'Owner' and rp.permission = 'tokens:manage'`,
        [team.teamId]
      ),
      /always holds every team permission/
    )
    await rejects(db.query("delete from organizations.members where team_id = $1", [team.teamId]), /at least one Owner/)
    await rejects(
      db.query("insert into organizations.role_permissions (team_id, role_id, permission, created_by) select team_id, id, 'analytics:read', $2 from organizations.roles where team_id = $1 and name = 'Member'", [team.teamId, team.userId]),
      /permission_check/
    )

    // Deleting the whole team takes its roles and members with it.
    await db.query("delete from organizations.teams where id = $1", [team.teamId])
    const { rows } = await db.query("select 1 from organizations.roles where team_id = $1", [team.teamId])
    assert.equal(rows.length, 0)
  })

  it("grants the first Admin once, only as the database owner", async () => {
    const { rows } = await db.query<{ outcome: string }>("select organizations.grant_first_admin('auth0|someone-else') as outcome")
    assert.equal(rows[0]?.outcome, "unchanged")
    const admins = await db.query<{ n: number }>("select count(*)::int as n from organizations.platform_admins")
    assert.equal(admins.rows[0]?.n, 1)
    await rejects(asUser(null, (tx) => tx.query("select organizations.grant_first_admin('auth0|me')")), /permission denied/)
  })

  it("never leaves the platform without an Admin, and audits every grant", async () => {
    await rejects(db.query("delete from organizations.platform_admins"), /at least one Admin/)
    const { rows } = await db.query<{ n: number }>("select count(*)::int as n from organizations.audit_log where action = 'admin.granted'")
    assert.equal(rows[0]?.n, 1)
    await rejects(db.query("delete from organizations.audit_log"), /insert-only/)
  })
})
