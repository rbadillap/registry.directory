// Triggers a production rebuild through the existing Vercel deploy hook —
// the same one the daily cron uses. Run it after ingest + generate when you
// want the site to pick up fresh blobs immediately instead of waiting for
// the next scheduled rebuild:
//
//   pnpm ingest && pnpm generate && pnpm deploy
//
// Deliberately a separate command: writing blobs never deploys by itself.

const url = process.env.VERCEL_DEPLOY_HOOK_URL;
if (!url) {
  console.error("VERCEL_DEPLOY_HOOK_URL missing — run with --env-file=.env.local");
  process.exit(1);
}

const res = await fetch(url, { method: "POST" });
if (!res.ok) {
  console.error(`deploy hook answered HTTP ${res.status}`);
  process.exit(1);
}
const body = await res.json().catch(() => ({}));
console.log(`deploy triggered${body?.job?.id ? ` — job ${body.job.id}` : ""}`);
console.log("watch it at https://vercel.com — or `vercel ls` from the repo");
