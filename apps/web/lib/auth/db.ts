import "server-only"
import { Pool } from "pg"
import type { Database } from "@workspace/organizations"

// The app connects as app_user, a role without BYPASSRLS, so row-level
// security always applies. It reads only APP_DATABASE_URL: Neon's Vercel
// integration injects DATABASE_URL as the owner, and a generic name invites
// the wrong connection. The owner's URL (DATABASE_OWNER_URL) never reaches
// the app; it only runs migrations, by hand.
const APP_ROLE = "app_user"

let pool: Pool | undefined
let verified: Promise<void> | undefined

async function verifyRole(p: Pool): Promise<void> {
  const { rows } = await p.query<{ role: string }>("select current_user as role")
  if (rows[0]?.role !== APP_ROLE) {
    throw new Error(`APP_DATABASE_URL must connect as ${APP_ROLE}, not ${rows[0]?.role ?? "unknown"}`)
  }
}

export function database(): Database {
  const url = process.env.APP_DATABASE_URL
  if (!url) throw new Error("APP_DATABASE_URL is not set")
  pool ??= new Pool({ connectionString: url, max: 5 })
  const p = pool
  return {
    async query(text, params) {
      // Refuse to work at all if the URL is anyone but app_user. A failed
      // check is retried on the next query rather than cached.
      verified ??= verifyRole(p).catch((error) => {
        verified = undefined
        throw error
      })
      await verified
      return p.query(text, params) as never
    },
  }
}
