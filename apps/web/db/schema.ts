// The Dashboard's tables, in Drizzle. `drizzle-kit generate` turns changes
// here into migrations. What Drizzle can't express — COMMENTs, row-level
// security, triggers, security-definer functions, grants and the app_user
// role — lives in hand-written migrations (`drizzle-kit generate --custom`).
// See db/README.md.

import { sql } from "drizzle-orm"
import {
  boolean,
  check,
  foreignKey,
  index,
  jsonb,
  pgSchema,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core"
import { RESERVED_HANDLES, TEAM_PERMISSIONS } from "@workspace/organizations"

// Literal SQL lists from the lists in code, so a CHECK always matches them.
const sqlList = (values: readonly string[]) => sql.raw(values.map((v) => `'${v.replaceAll("'", "''")}'`).join(", "))
const TEAM_PERMISSIONS_SQL = sqlList(TEAM_PERMISSIONS)
const RESERVED_SQL = sqlList(RESERVED_HANDLES)

const id = () => uuid("id").primaryKey().defaultRandom()
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
const updatedAt = () => timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()

// --- organizations ----------------------------------------------------------

export const organizations = pgSchema("organizations")

export const users = organizations.table("users", {
  id: id(),
  auth0Subject: text("auth0_subject").notNull().unique("users_auth0_subject_key"),
  createdAt: createdAt(),
})

export const teams = organizations.table(
  "teams",
  {
    id: id(),
    handle: text("handle").notNull().unique("teams_handle_key"),
    createdAt: createdAt(),
    createdBy: uuid("created_by").notNull().references(() => users.id),
    updatedAt: updatedAt(),
  },
  (t) => [
    check(
      "teams_handle_check",
      sql`${t.handle} ~ '^[a-z0-9](?:[a-z0-9-]{0,37}[a-z0-9])?$' and ${t.handle} not in (${RESERVED_SQL})`
    ),
  ]
)

export const roles = organizations.table(
  "roles",
  {
    id: id(),
    teamId: uuid("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    system: boolean("system").notNull().default(false),
    createdAt: createdAt(),
    createdBy: uuid("created_by").notNull().references(() => users.id),
    updatedAt: updatedAt(),
  },
  (t) => [
    unique("roles_team_id_name_key").on(t.teamId, t.name),
    unique("roles_id_team_id_key").on(t.id, t.teamId),
    check("roles_name_check", sql`length(${t.name}) between 1 and 40`),
  ]
)

export const rolePermissions = organizations.table(
  "role_permissions",
  {
    id: id(),
    teamId: uuid("team_id").notNull(),
    roleId: uuid("role_id").notNull(),
    permission: text("permission").notNull(),
    createdAt: createdAt(),
    createdBy: uuid("created_by").notNull().references(() => users.id),
  },
  (t) => [
    unique("role_permissions_role_id_permission_key").on(t.roleId, t.permission),
    foreignKey({
      name: "role_permissions_role_fkey",
      columns: [t.roleId, t.teamId],
      foreignColumns: [roles.id, roles.teamId],
    }).onDelete("cascade"),
    check("role_permissions_permission_check", sql`${t.permission} in (${TEAM_PERMISSIONS_SQL})`),
  ]
)

export const members = organizations.table(
  "members",
  {
    id: id(),
    teamId: uuid("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id),
    roleId: uuid("role_id").notNull(),
    createdAt: createdAt(),
    createdBy: uuid("created_by").notNull().references(() => users.id),
    updatedAt: updatedAt(),
  },
  (t) => [
    unique("members_team_id_user_id_key").on(t.teamId, t.userId),
    foreignKey({
      name: "members_role_fkey",
      columns: [t.roleId, t.teamId],
      foreignColumns: [roles.id, roles.teamId],
    }),
  ]
)

export const tokens = organizations.table(
  "tokens",
  {
    id: id(),
    teamId: uuid("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    secretHash: text("secret_hash").notNull().unique("tokens_secret_hash_key"),
    scopes: text("scopes").array().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: createdAt(),
    createdBy: uuid("created_by").notNull().references(() => users.id),
    updatedAt: updatedAt(),
  },
  (t) => [
    check("tokens_name_check", sql`length(${t.name}) between 1 and 80`),
    check(
      "tokens_scopes_check",
      sql`cardinality(${t.scopes}) > 0 and ${t.scopes} <@ array[${TEAM_PERMISSIONS_SQL}]::text[]`
    ),
  ]
)

export const platformAdmins = organizations.table("platform_admins", {
  id: id(),
  userId: uuid("user_id").notNull().unique("platform_admins_user_id_key").references(() => users.id),
  createdAt: createdAt(),
  createdBy: uuid("created_by").references(() => users.id),
})

export const auditLog = organizations.table("audit_log", {
  id: id(),
  teamId: uuid("team_id").references(() => teams.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  detail: jsonb("detail").notNull().default({}),
  createdAt: createdAt(),
  createdBy: uuid("created_by").references(() => users.id),
})

// --- dashboard --------------------------------------------------------------

export const dashboard = pgSchema("dashboard")

export const brands = dashboard.table(
  "brands",
  {
    id: id(),
    teamId: uuid("team_id")
      .notNull()
      .unique("brands_team_id_key")
      .references(() => teams.id, { onDelete: "cascade" }),
    designMd: text("design_md").notNull(),
    lightTheme: jsonb("light_theme").notNull(),
    darkParams: jsonb("dark_params").notNull().default({}),
    darkParamsSource: text("dark_params_source", { enum: ["default", "agent", "yours"] })
      .notNull()
      .default("default"),
    darkOverrides: jsonb("dark_overrides").notNull().default({}),
    createdAt: createdAt(),
    createdBy: uuid("created_by").notNull().references(() => users.id),
    updatedAt: updatedAt(),
  },
  (t) => [
    check("brands_dark_params_source_check", sql`${t.darkParamsSource} in ('default', 'agent', 'yours')`),
  ]
)

// --- feedback ---------------------------------------------------------------

export const feedback = pgSchema("feedback")

// Never who: no person, token, IP address, user agent or file contents. That
// is why there's no created_by.
export const events = feedback.table(
  "events",
  {
    id: id(),
    teamId: uuid("team_id").references(() => teams.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: ["track", "answer"] }).notNull(),
    name: text("name").notNull(),
    subject: text("subject"),
    props: jsonb("props").notNull().default({}),
    createdAt: createdAt(),
  },
  (t) => [
    index("events_team_name_created").on(t.teamId, t.name, t.createdAt),
    check("events_kind_check", sql`${t.kind} in ('track', 'answer')`),
    check("events_name_check", sql`length(${t.name}) between 1 and 80`),
    check("events_subject_check", sql`length(${t.subject}) <= 200`),
  ]
)
