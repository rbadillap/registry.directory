// Permissions live in code; roles live in data. This list is fixed and typed,
// and the database holds the same one in organizations.team_permissions(). A
// test checks both agree.

export const TEAM_PERMISSIONS = [
  "items:read",
  "items:save",
  "items:mark",
  "rules:read",
  "rules:write",
  "activity:read",
  "presets:write",
  "members:manage",
  "tokens:manage",
  "settings:write",
  "feedback:configure",
] as const

// Platform permissions belong to the Admin role only. No team role holds them.
export const PLATFORM_PERMISSIONS = [
  "submissions:review",
  "origins:read",
  "home:edit",
  "analytics:read",
  "feedback:manage",
] as const

export type TeamPermission = (typeof TEAM_PERMISSIONS)[number]
export type PlatformPermission = (typeof PLATFORM_PERMISSIONS)[number]
export type Permission = TeamPermission | PlatformPermission

export function isTeamPermission(value: string): value is TeamPermission {
  return (TEAM_PERMISSIONS as readonly string[]).includes(value)
}

export function isPlatformPermission(value: string): value is PlatformPermission {
  return (PLATFORM_PERMISSIONS as readonly string[]).includes(value)
}
