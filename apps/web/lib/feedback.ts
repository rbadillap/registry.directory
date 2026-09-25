import { get, put } from "@vercel/blob";
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

// The store is private: reads go through the SDK, authenticated like writes
// (Vercel OIDC paired with BLOB_STORE_ID).
async function readFeedbackBlob(filename: string): Promise<FeedbackEntry[]> {
  if (!process.env.BLOB_STORE_ID) return [];

  try {
    const result = await get(filename, { access: "private", useCache: false });
    if (result?.statusCode !== 200) return [];
    return (await new Response(result.stream).json()) as FeedbackEntry[];
  } catch {
    return [];
  }
}

async function writeFeedbackBlob(
  filename: string,
  entries: FeedbackEntry[]
): Promise<void> {
  if (!process.env.BLOB_STORE_ID) return;

  await put(filename, JSON.stringify(entries, null, 2), {
    access: "private",
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
