import { NextResponse, type NextRequest } from "next/server"
import { dashboardEnabled } from "@/lib/auth/flag"

// Sign-in for the Dashboard. With DASHBOARD_ENABLED off (production today)
// this does nothing and /api/auth/* answers 404, as before. It only runs on
// the Dashboard's own paths, so the public site never waits on it.
export async function middleware(request: NextRequest) {
  if (!dashboardEnabled()) return NextResponse.next()
  const { auth0 } = await import("@/lib/auth/auth0")
  return auth0().middleware(request)
}

export const config = {
  // Node, not Edge: the sign-in callback writes to Postgres.
  runtime: "nodejs",
  matcher: ["/api/auth/:path*", "/dashboard/:path*"],
}
