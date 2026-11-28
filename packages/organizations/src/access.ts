import {
  isPlatformPermission,
  isTeamPermission,
  type Permission,
  type TeamPermission,
} from "./permissions.ts"
import { checkHandle, generateHandle, type HandleCheck } from "./handles.ts"

/**
 * The smallest thing this package needs from Postgres. A `pg` Pool or Client
 * and PGlite both fit, so the core never depends on a driver.
 */
export interface Database {
  query<Row = Record<string, unknown>>(text: string, params?: unknown[]): Promise<{ rows: Row[] }>
}

/**
 * Who is asking. It comes from the app's auth adapter (Auth0 today) or from
 * a verified team token; this package never signs anyone in.
 */
export type Identity =
  | { kind: "user"; userId: string }
  | {
      kind: "token"
      tokenId: string
      teamId: string
      createdBy: string
      scopes: readonly TeamPermission[]
    }

/** The team being acted on. Checks run on the id; the handle only names it in messages. */
export interface TeamRef {
  teamId: string
  handle?: string
}

// What each team permission lets you do, in the words of a 403 message:
// "You can't {action} {handle}. Ask an Owner of {handle} for access."
const ACTIONS: Record<TeamPermission, string> = {
  "items:read": "install private components from",
  "items:save": "save components to",
  "items:mark": "mark components in",
  "rules:read": "read the agent rules of",
  "rules:write": "change the agent rules of",
  "activity:read": "see the activity of",
  "presets:write": "change the brand of",
  "members:manage": "manage the members of",
  "tokens:manage": "create tokens for",
  "settings:write": "change the settings of",
  "feedback:configure": "change how often questions are asked in",
}

/**
 * Thrown by requireCan. `status` is 404 when the identity isn't a member (a
 * response never reveals that a team exists) and 403 when it is a member
 * without the permission. `message` is safe to show a person; `permission` is
 * for debugging and goes in its own field.
 */
export class AccessDenied extends Error {
  readonly status: 403 | 404
  readonly permission: Permission

  constructor(status: 403 | 404, permission: Permission, message: string) {
    super(message)
    this.name = "AccessDenied"
    this.status = status
    this.permission = permission
  }

  toJSON() {
    return this.status === 404
      ? { message: "Not found." }
      : { message: this.message, permission: this.permission }
  }
}

export interface SignInResult {
  userId: string
  teamId: string
  handle: string
  teamCreated: boolean
}

export interface Organizations {
  can(identity: Identity | null | undefined, permission: string, team?: TeamRef): Promise<boolean>
  requireCan(identity: Identity | null | undefined, permission: string, team?: TeamRef): Promise<void>
  signIn(subject: string, check?: HandleCheck): Promise<SignInResult>
}

export interface OrganizationsOptions {
  db: Database
  /** Where failures are reported. Defaults to console.error. */
  log?: (message: string, error?: unknown) => void
}

const HANDLE_ATTEMPTS = 8

export function createOrganizations({ db, log = defaultLog }: OrganizationsOptions): Organizations {
  async function bool(text: string, params: unknown[]): Promise<boolean> {
    const { rows } = await db.query<{ ok: boolean }>(text, params)
    return rows[0]?.ok === true
  }

  // Deny by default: an unknown permission, no identity, no team for a team
  // permission or a database error all mean no.
  async function can(identity: Identity | null | undefined, permission: string, team?: TeamRef) {
    if (!identity) return false
    try {
      if (isPlatformPermission(permission)) {
        if (identity.kind !== "user") return false
        return await bool("select organizations.is_platform_admin($1) as ok", [identity.userId])
      }
      if (!isTeamPermission(permission) || !team?.teamId) return false

      if (identity.kind === "user") {
        return await bool("select organizations.has_permission($1, $2, $3) as ok", [
          team.teamId,
          permission,
          identity.userId,
        ])
      }

      // A token opens only its own team, only for its scopes, and never for
      // more than its creator can still do today.
      if (identity.teamId !== team.teamId || !identity.scopes.includes(permission)) return false
      return await bool("select organizations.has_permission($1, $2, $3) as ok", [
        team.teamId,
        permission,
        identity.createdBy,
      ])
    } catch (error) {
      log(`organizations: can(${permission}) failed, denying`, error)
      return false
    }
  }

  async function isMember(identity: Identity, teamId: string): Promise<boolean> {
    if (identity.kind === "token") {
      if (identity.teamId !== teamId) return false
      return bool("select organizations.is_member($1, $2) as ok", [teamId, identity.createdBy])
    }
    return bool("select organizations.is_member($1, $2) as ok", [teamId, identity.userId])
  }

  async function recordDenial(identity: Identity | null | undefined, permission: string, team?: TeamRef) {
    try {
      await db.query("select organizations.record_denial($1, $2, $3, $4)", [
        team?.teamId ?? null,
        permission,
        identity ? (identity.kind === "user" ? identity.userId : identity.createdBy) : null,
        identity?.kind === "token" ? identity.tokenId : null,
      ])
    } catch (error) {
      log("organizations: could not record a denial", error)
    }
  }

  async function requireCan(identity: Identity | null | undefined, permission: string, team?: TeamRef) {
    if (await can(identity, permission, team)) return
    await recordDenial(identity, permission, team)

    const known = isTeamPermission(permission) || isPlatformPermission(permission)
    const perm = (known ? permission : "items:read") as Permission
    if (!identity || !team?.teamId || !isTeamPermission(permission)) {
      throw new AccessDenied(404, perm, "Not found.")
    }
    let member = false
    try {
      member = await isMember(identity, team.teamId)
    } catch (error) {
      log("organizations: membership check failed, answering 404", error)
    }
    if (!member) throw new AccessDenied(404, perm, "Not found.")

    const name = team.handle ?? "this team"
    throw new AccessDenied(
      403,
      perm,
      `You can't ${ACTIONS[permission]} ${name}. Ask an Owner of ${name} for access.`
    )
  }

  // The person exists afterwards, and so does their team. A new team gets an
  // automatic handle that is neither reserved nor a directory key; if another
  // team took it in the meantime, try another.
  async function signIn(subject: string, check: HandleCheck = {}): Promise<SignInResult> {
    if (!subject) throw new Error("signIn needs the Auth0 subject")
    let lastError: unknown
    for (let attempt = 0; attempt < HANDLE_ATTEMPTS; attempt++) {
      const handle = generateHandle()
      if (checkHandle(handle, check)) continue
      try {
        const { rows } = await db.query<{
          user_id: string
          team_id: string
          handle: string
          team_created: boolean
        }>("select * from organizations.sign_in($1, $2)", [subject, handle])
        const row = rows[0]
        if (!row) throw new Error("sign_in returned nothing")
        return {
          userId: row.user_id,
          teamId: row.team_id,
          handle: row.handle,
          teamCreated: row.team_created,
        }
      } catch (error) {
        if (!isHandleTaken(error)) throw error
        lastError = error
      }
    }
    throw new Error("Could not find a free team handle", { cause: lastError })
  }

  return { can, requireCan, signIn }
}

function isHandleTaken(error: unknown): boolean {
  const e = error as { code?: string; constraint?: string; message?: string } | null
  return e?.code === "23505" && (e.constraint === "teams_handle_key" || /teams_handle_key/.test(e.message ?? ""))
}

function defaultLog(message: string, error?: unknown) {
  console.error(message, error)
}
