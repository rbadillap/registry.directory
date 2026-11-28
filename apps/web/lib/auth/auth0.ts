import "server-only"
import { NextResponse } from "next/server"
import { Auth0Client } from "@auth0/nextjs-auth0/server"
import { createOrganizations } from "@workspace/organizations"
import directory from "@/public/directory.json"
import { directoryKeys } from "@/lib/directory-keys"
import type { DirectoryEntry } from "@/lib/types"
import { database } from "./db"

const DIRECTORY_KEYS = directoryKeys((directory as { registries: DirectoryEntry[] }).registries)

let client: Auth0Client | undefined

// Built on first use, so nothing reads the Auth0 variables while the flag is
// off. The SDK reads AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET,
// AUTH0_SECRET and APP_BASE_URL from the environment.
export function auth0(): Auth0Client {
  client ??= new Auth0Client({
    // Sign-in lives under /api/auth, so no root route is taken from registries.
    routes: {
      login: "/api/auth/login",
      logout: "/api/auth/logout",
      callback: "/api/auth/callback",
      profile: "/api/auth/profile",
      accessToken: "/api/auth/access-token",
      backChannelLogout: "/api/auth/backchannel-logout",
    },
    // We only need who you are, never a token to call another API from the browser.
    enableAccessTokenEndpoint: false,
    // Identity only: openid gives the subject, which is all we keep.
    authorizationParameters: { scope: "openid" },

    // The first sign-in creates the person's team, with an automatic handle
    // and the Owner role. Later sign-ins find it.
    async onCallback(error, ctx, session) {
      const base = ctx.appBaseUrl ?? process.env.APP_BASE_URL ?? "/"
      if (error || !session) {
        return NextResponse.redirect(new URL("/?signin=failed", base))
      }
      try {
        await createOrganizations({ db: database() }).signIn(session.user.sub, {
          directoryKeys: DIRECTORY_KEYS,
        })
      } catch (cause) {
        console.error("auth: could not record the sign-in", cause)
        return NextResponse.redirect(new URL("/?signin=failed", base))
      }
      return NextResponse.redirect(new URL(ctx.returnTo ?? "/", base))
    },
  })
  return client
}

export { DIRECTORY_KEYS }
