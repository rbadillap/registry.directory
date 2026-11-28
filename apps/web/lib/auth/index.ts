import "server-only"
import { cache } from "react"
import {
  createOrganizations,
  type Identity,
  type Organizations,
  type TeamRef,
} from "@workspace/organizations"
import { auth0, DIRECTORY_KEYS } from "./auth0"
import { database } from "./db"
import { dashboardEnabled } from "./flag"

// The app's side of authorization. Authentication (who you are) comes from
// Auth0; authorization (what you may do) is @workspace/organizations, which
// resolves roles and permissions from the database. Everything here answers
// "no" while the Dashboard is turned off.

export { AccessDenied } from "@workspace/organizations"
export { dashboardEnabled }

function organizations(): Organizations {
  return createOrganizations({ db: database() })
}

/**
 * Who is signed in, as an identity can() understands, or null. Cached per
 * request. A person signed in to Auth0 whose sign-in wasn't recorded yet
 * (the callback failed halfway) is recorded here.
 */
export const getIdentity = cache(async (): Promise<Identity | null> => {
  if (!dashboardEnabled()) return null
  const session = await auth0().getSession()
  const subject = session?.user.sub
  if (!subject) return null

  try {
    const { rows } = await database().query<{ id: string | null }>(
      "select organizations.user_id_for($1) as id",
      [subject]
    )
    const userId =
      rows[0]?.id ??
      (await organizations().signIn(subject, { directoryKeys: DIRECTORY_KEYS })).userId
    return { kind: "user", userId }
  } catch (error) {
    console.error("auth: could not resolve the signed-in person", error)
    return null
  }
})

/** Yes or no. Deny by default. */
export async function can(permission: string, team?: TeamRef, identity?: Identity | null): Promise<boolean> {
  return organizations().can(identity === undefined ? await getIdentity() : identity, permission, team)
}

/**
 * The same check, but it stops the request: it throws AccessDenied with a 404
 * for a non-member and a 403 with a readable message for a member without the
 * permission.
 */
export async function requireCan(permission: string, team?: TeamRef, identity?: Identity | null): Promise<void> {
  return organizations().requireCan(identity === undefined ? await getIdentity() : identity, permission, team)
}
