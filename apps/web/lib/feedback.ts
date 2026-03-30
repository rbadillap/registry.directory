import { put } from "@vercel/blob";
import { z } from "zod";

export const feedbackTypes = ["bug", "confusing", "idea"] as const;
export type FeedbackType = (typeof feedbackTypes)[number];

export const feedbackSchema = z.object({
  type: z.enum(feedbackTypes),
  message: z.string().min(1).max(2000),
  url: z.string().url(),
  pathname: z.string(),
  userAgent: z.string(),
  viewport: z.object({
    width: z.number(),
    height: z.number(),
  }),
});

export type FeedbackInput = z.infer<typeof feedbackSchema>;

export interface FeedbackEntry extends FeedbackInput {
  id: string;
  timestamp: string;
}

function getBlobFilename(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `feedback/${yyyy}-${mm}-${dd}.json`;
}

function getBlobPublicUrl(filename: string): string | null {
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (!blobToken) return null;

  const storeMatch = blobToken.match(/vercel_blob_rw_([^_]+)_/);
  if (!storeMatch) return null;

  return `https://${storeMatch[1]}.public.blob.vercel-storage.com/${filename}`;
}

async function readFeedbackBlob(filename: string): Promise<FeedbackEntry[]> {
  const url = getBlobPublicUrl(filename);
  if (!url) return [];

  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return [];
    return (await response.json()) as FeedbackEntry[];
  } catch {
    return [];
  }
}

async function writeFeedbackBlob(
  filename: string,
  entries: FeedbackEntry[]
): Promise<void> {
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (!blobToken) return;

  await put(filename, JSON.stringify(entries, null, 2), {
    access: "public",
    token: blobToken,
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

export async function appendFeedback(input: FeedbackInput): Promise<string> {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const entry: FeedbackEntry = {
    ...input,
    id,
    timestamp: new Date().toISOString(),
  };

  const filename = getBlobFilename(new Date());
  const existing = await readFeedbackBlob(filename);
  existing.push(entry);
  await writeFeedbackBlob(filename, existing);

  console.log(`[feedback] Saved entry ${id} to ${filename}`);
  return id;
}
