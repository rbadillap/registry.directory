// Every schema, table and column says in plain language what it holds. The
// comments live in the migration SQL; this fails when one is missing.
//
// Run with: pnpm test

import { strict as assert } from "node:assert"
import { after, before, describe, it } from "node:test"
import type { PGlite } from "@electric-sql/pglite"
import { RESERVED_HANDLES, TEAM_PERMISSIONS } from "@workspace/organizations"
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { MIGRATIONS, testDatabase } from "./test-db.ts"

const SCHEMAS = ["organizations", "dashboard", "feedback"]

let db: PGlite
before(async () => {
  db = await testDatabase()
})
after(() => db.close())

describe("comments", () => {
  it("creates the three schemas", async () => {
    const { rows } = await db.query<{ nspname: string }>(
      "select nspname from pg_namespace where nspname = any($1) order by nspname",
      [SCHEMAS]
    )
    assert.deepEqual(rows.map((r) => r.nspname), [...SCHEMAS].sort())
  })

  it("has a comment on every schema", async () => {
    const { rows } = await db.query<{ nspname: string }>(
      `select n.nspname from pg_namespace n
       where n.nspname = any($1)
         and coalesce(obj_description(n.oid, 'pg_namespace'), '') = ''`,
      [SCHEMAS]
    )
    assert.deepEqual(rows, [], `schemas without a comment: ${rows.map((r) => r.nspname).join(", ")}`)
  })

  it("has a comment on every table", async () => {
    const { rows } = await db.query<{ name: string }>(
      `select n.nspname || '.' || c.relname as name
       from pg_class c join pg_namespace n on n.oid = c.relnamespace
       left join pg_description d on d.objoid = c.oid and d.classoid = 'pg_class'::regclass and d.objsubid = 0
       where n.nspname = any($1) and c.relkind in ('r', 'p', 'v', 'm')
         and coalesce(d.description, '') = ''`,
      [SCHEMAS]
    )
    assert.deepEqual(rows, [], `tables without a comment: ${rows.map((r) => r.name).join(", ")}`)
  })

  it("has a comment on every column", async () => {
    const { rows } = await db.query<{ name: string }>(
      `select n.nspname || '.' || c.relname || '.' || a.attname as name
       from pg_attribute a
       join pg_class c on c.oid = a.attrelid
       join pg_namespace n on n.oid = c.relnamespace
       left join pg_description d on d.objoid = c.oid and d.classoid = 'pg_class'::regclass and d.objsubid = a.attnum
       where n.nspname = any($1) and c.relkind in ('r', 'p', 'v', 'm')
         and a.attnum > 0 and not a.attisdropped
         and coalesce(d.description, '') = ''`,
      [SCHEMAS]
    )
    assert.deepEqual(rows, [], `columns without a comment: ${rows.map((r) => r.name).join(", ")}`)
  })
})

describe("the migrations journal", () => {
  // drizzle-kit migrate silently skips a .sql file the journal doesn't list,
  // for example one written by hand instead of with `generate --custom`.
  it("lists every migration file, in order", () => {
    const journal = JSON.parse(readFileSync(join(MIGRATIONS, "meta/_journal.json"), "utf8")) as {
      entries: { tag: string }[]
    }
    const files = readdirSync(MIGRATIONS)
      .filter((f) => f.endsWith(".sql"))
      .map((f) => f.replace(/\.sql$/, ""))
      .sort()
    assert.deepEqual(journal.entries.map((e) => e.tag), files)
  })
})

describe("lists kept in code and in the database", () => {
  it("agree on the team permissions", async () => {
    const { rows } = await db.query<{ list: string[] }>("select organizations.team_permissions() as list")
    assert.deepEqual(rows[0]?.list, [...TEAM_PERMISSIONS])
  })

  it("agree on the reserved handles", async () => {
    const { rows } = await db.query<{ list: string[] }>("select organizations.reserved_handles() as list")
    assert.deepEqual(rows[0]?.list, [...RESERVED_HANDLES])
  })
})
