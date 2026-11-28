import { defineConfig } from "drizzle-kit"

// Migrations run as the database owner (it has BYPASSRLS), by hand, once per
// environment: `pnpm db:migrate`. The owner's URL is direct, not pooled, and
// lives only on the machine that runs migrations; the app never reads it.
// `drizzle-kit generate` needs no database.
export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema.ts",
  out: "./db/migrations",
  schemaFilter: ["organizations", "dashboard", "feedback"],
  dbCredentials: { url: process.env.DATABASE_OWNER_URL ?? "" },
  migrations: { schema: "drizzle", table: "__drizzle_migrations" },
  strict: true,
  verbose: true,
})
