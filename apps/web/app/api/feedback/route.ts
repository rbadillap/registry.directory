import { NextResponse } from "next/server";
import { feedbackSchema, appendFeedback } from "@/lib/feedback";

export async function POST(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Feedback storage not configured" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const parsed = feedbackSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid feedback", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

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
