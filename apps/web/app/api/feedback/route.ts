import { NextResponse } from "next/server";
import { readBodyWithLimit } from "@/lib/body-limit";
import { feedbackSchema, appendFeedback } from "@/lib/feedback";

// The schema caps message at 2,000 chars; a legit payload never gets near
// this. Same ceiling as /api/submit.
const MAX_BODY_BYTES = 10_000;

function payloadTooLarge(): NextResponse {
  return NextResponse.json(
    { error: `Request body too large (max ${MAX_BODY_BYTES} bytes)` },
    { status: 413 }
  );
}

export async function POST(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Feedback storage not configured" },
      { status: 503 }
    );
  }

  // The header check is a fast path only — a chunked request has no
  // Content-Length, so the real limit is enforced while reading the body.
  const contentLength = Number(request.headers.get("content-length"));
  if (contentLength > MAX_BODY_BYTES) {
    return payloadTooLarge();
  }

  const rawBody = await readBodyWithLimit(request, MAX_BODY_BYTES);
  if (rawBody === null) {
    return payloadTooLarge();
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON" },
      { status: 400 }
    );
  }

  const parsed = feedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid feedback", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const id = await appendFeedback(parsed.data);
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("[feedback] API error:", error);
    return NextResponse.json(
      { error: "Failed to save feedback" },
      { status: 500 }
    );
  }
}
