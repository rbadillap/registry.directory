// Lists pending registry submissions stored in Vercel Blob.
// Usage (from apps/web):  pnpm exec varlock run -- node scripts/list-pending-submissions.mjs
import { get, list } from "@vercel/blob";

if (!process.env.BLOB_STORE_ID) {
  console.error("BLOB_STORE_ID is not set. Run through Varlock: pnpm exec varlock run -- node <script>");
  process.exit(1);
}

const { blobs } = await list({ prefix: "submissions/pending/" });

if (blobs.length === 0) {
  console.log("No pending submissions.");
  process.exit(0);
}

const entries = await Promise.all(
  blobs.map(async (blob) => {
    // Read from origin: the cache can serve stale content right after an
    // update.
    const result = await get(blob.pathname, { access: "private", useCache: false });
    return new Response(result.stream).json();
  })
);

entries.sort((a, b) => a.submitted_at.localeCompare(b.submitted_at));
console.log(JSON.stringify(entries, null, 2));
