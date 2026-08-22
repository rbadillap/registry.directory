// Deletes one pending registry submission from Vercel Blob — the manual step
// after a review decision, and the cleanup step for test submissions.
// Usage (from apps/web):
//   node --env-file=.env.local scripts/delete-pending-submission.mjs <registry_url | id>
// Pass either the submission's registry_url (the id is derived the same way
// the API derives it) or the id itself as shown by list-pending-submissions.
import { createHash } from "node:crypto";
import { del, list } from "@vercel/blob";

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error("BLOB_READ_WRITE_TOKEN is not set. Run with --env-file=.env.local");
  process.exit(1);
}

const target = process.argv[2];
if (!target) {
  console.error("Usage: node scripts/delete-pending-submission.mjs <registry_url | id>");
  process.exit(1);
}

// Mirrors submissionId() in lib/submissions.ts — kept in sync by the shared
// shape of the blob pathname this script must hit.
function submissionId(registryUrl) {
  let normalized;
  try {
    const parsed = new URL(registryUrl.trim());
    normalized = parsed.origin + parsed.pathname.replace(/\/+$/, "") + parsed.search;
  } catch {
    normalized = registryUrl.trim().replace(/\/+$/, "");
  }
  const slug = normalized
    .replace(/^https:\/\//, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  const hash = createHash("sha256").update(normalized).digest("hex").slice(0, 8);
  return `${slug}-${hash}`;
}

const id = target.startsWith("https://") ? submissionId(target) : target;
const pathname = `submissions/pending/${id}.json`;

const { blobs } = await list({ prefix: pathname, limit: 1 });
const blob = blobs.find((b) => b.pathname === pathname);
if (!blob) {
  console.error(`No pending submission at ${pathname}`);
  process.exit(1);
}

await del(blob.url);
console.log(`Deleted ${pathname}`);
