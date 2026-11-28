// The Dashboard ships turned off. Production keeps DASHBOARD_ENABLED unset;
// local and dev set it to "true". Launching is turning it on; rolling back is
// turning it off.
export function dashboardEnabled(): boolean {
  return process.env.DASHBOARD_ENABLED === "true"
}
