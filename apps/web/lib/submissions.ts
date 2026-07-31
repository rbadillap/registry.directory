import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { put } from "@vercel/blob";
import { z } from "zod";

const DOCS_URL = "https://registry.directory/how-to-submit.md";

export const submissionSchema = z.object({
  name: z
    .string({ required_error: `name is required — the display name of your registry. See ${DOCS_URL}#fields` })
    .min(1, "name cannot be empty")
    .max(100, "name must be 100 characters or fewer"),
  description: z
    .string({ required_error: `description is required — one sentence describing what your registry provides. See ${DOCS_URL}#fields` })
    .min(1, "description cannot be empty")
    .max(300, "description must be 300 characters or fewer"),
  url: z
    .string({ required_error: `url is required — your registry's homepage. See ${DOCS_URL}#fields` })
    .url("url must be a valid URL")
    .startsWith("https://", "url must use https"),
  registry_url: z
    .string({ required_error: `registry_url is required — the direct URL to your registry.json file (e.g. https://example.com/r/registry.json). It is the unique key for your submission. See ${DOCS_URL}#fields` })
    .url("registry_url must be a valid URL")
    .startsWith("https://", "registry_url must use https"),
  github_url: z
    .string()
    .url("github_url must be a valid URL")
    .startsWith("https://github.com/", "github_url must be a https://github.com/ repository URL")
    .optional(),
  github_profile: z
    .string()
    .url("github_profile must be a valid URL")
    .startsWith("https://", `github_profile must use https — typically https://github.com/<owner>.png. See ${DOCS_URL}#fields`)
    .optional(),
});

export type SubmissionInput = z.infer<typeof submissionSchema>;

export interface SubmissionEntry {
  id: string;
  status: "pending";
  origin: "api";
  submitted_at: string;
  updated_at: string;
  registry: SubmissionInput;
}

export function normalizeRegistryUrl(url: string): string {
  return url.trim().toLowerCase().replace(/\/+$/, "");
}

// The readable slug alone is not injective (e.g. "r/registry.json" and
// "r/registry-json" collapse to the same slug), which would let one URL
// overwrite another URL's pending submission. The hash suffix guarantees
// distinct URLs always map to distinct blob paths.
export function submissionId(registryUrl: string): string {
  const normalized = normalizeRegistryUrl(registryUrl);
  const slug = normalized
    .replace(/^https:\/\//, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  const hash = createHash("sha256").update(normalized).digest("hex").slice(0, 8);
  return `${slug}-${hash}`;
}

// Stateless update credential: derived from the registry_url and a server
// secret, so no token storage is needed. Returned once on creation; required
// to overwrite a pending submission. Without it, anyone could deface a
// pending submission by re-POSTing its registry_url with different fields.
export function submissionToken(registryUrl: string): string | null {
  const secret = process.env.SUBMISSION_SECRET;
  if (!secret) return null;

  return createHmac("sha256", secret)
    .update(normalizeRegistryUrl(registryUrl))
    .digest("hex");
}

export function isValidSubmissionToken(
  registryUrl: string,
  provided: string
): boolean {
  const expected = submissionToken(registryUrl);
  if (!expected) return false;

  const expectedBuffer = Buffer.from(expected, "utf8");
  const providedBuffer = Buffer.from(provided, "utf8");
  if (expectedBuffer.length !== providedBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, providedBuffer);
}

function getBlobFilename(id: string): string {
  return `submissions/pending/${id}.json`;
}

function getBlobPublicUrl(filename: string): string | null {
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (!blobToken) return null;

  const storeMatch = blobToken.match(/vercel_blob_rw_([^_]+)_/);
  if (!storeMatch) return null;

  return `https://${storeMatch[1]}.public.blob.vercel-storage.com/${filename}`;
}

export async function getSubmission(
  registryUrl: string
): Promise<SubmissionEntry | null> {
  const url = getBlobPublicUrl(getBlobFilename(submissionId(registryUrl)));
  if (!url) return null;

  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return null;
    return (await response.json()) as SubmissionEntry;
  } catch {
    return null;
  }
}

export async function saveSubmission(
  input: SubmissionInput,
  existing: SubmissionEntry | null
): Promise<SubmissionEntry> {
  const id = submissionId(input.registry_url);
  const now = new Date().toISOString();

  const entry: SubmissionEntry = {
    id,
    status: "pending",
    origin: "api",
    submitted_at: existing?.submitted_at ?? now,
    updated_at: now,
    registry: input,
  };

  await put(getBlobFilename(id), JSON.stringify(entry, null, 2), {
    access: "public",
    token: process.env.BLOB_READ_WRITE_TOKEN,
    addRandomSuffix: false,
    allowOverwrite: true,
  });

  console.log(
    `[submissions] ${existing ? "Updated" : "Created"} submission ${id}`
  );
  return entry;
}
