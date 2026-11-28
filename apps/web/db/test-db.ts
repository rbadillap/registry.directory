// A throwaway Postgres in memory (PGlite) with every migration applied by
// Drizzle's migrator, from the same journal `drizzle-kit migrate` reads. No
// network and no secrets, so CI runs it as is.

import { join } from "node:path"
import { PGlite } from "@electric-sql/pglite"
import { drizzle } from "drizzle-orm/pglite"
import { migrate } from "drizzle-orm/pglite/migrator"

export const MIGRATIONS = join(import.meta.dirname, "migrations")

/** Applies every migration, then grants the first Admin when a subject is given. */
export async function testDatabase({ firstAdmin }: { firstAdmin?: string } = {}): Promise<PGlite> {
  const client = await PGlite.create()
  await migrate(drizzle({ client }), { migrationsFolder: MIGRATIONS })
  if (firstAdmin) await client.query("select organizations.grant_first_admin($1)", [firstAdmin])
  return client
}
