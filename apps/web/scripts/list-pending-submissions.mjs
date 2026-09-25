// Lists pending registry submissions stored in Vercel Blob.
// Usage (from apps/web):  pnpm exec varlock run -- node scripts/list-pending-submissions.mjs
import { list } from "@vercel/blob";

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error("BLOB_READ_WRITE_TOKEN is not set. Run through Varlock: pnpm exec varlock run -- node <script>");
  process.exit(1);
}

const { blobs } = await list({ prefix: "submissions/pending/" });

if (blobs.length === 0) {
  console.log("No pending submissions.");
  process.exit(0);
}

const entries = await Promise.all(
  blobs.map(async (blob) => {
    // Cache-busting query — the public URL goes through the Blob CDN, which
    // can serve stale content right after an update.
    const response = await fetch(`${blob.url}?v=${Date.now()}`, {
      cache: "no-store",
    });
    return response.json();
  })
);

entries.sort((a, b) => a.submitted_at.localeCompare(b.submitted_at));
console.log(JSON.stringify(entries, null, 2));
