export function addUtmParams(
  url: string,
  campaign: string,
  options?: {
    source?: string
    medium?: string
  }
) {
  try {
    const u = new URL(url)
    u.searchParams.set("utm_source", options?.source || "registry.directory")
    u.searchParams.set("utm_medium", options?.medium || "directory")
    u.searchParams.set("utm_campaign", campaign)
    return u.toString()
  } catch {
    // Fallback if URL is invalid
    return url
  }
}
