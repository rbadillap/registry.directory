import { NextResponse } from "next/server";
import {
  submissionSchema,
  upsertSubmission,
  normalizeRegistryUrl,
} from "@/lib/submissions";

const DOCS_URL = "https://registry.directory/how-to-submit.md";

interface DirectoryFile {
  registries: Array<{ url: string; registry_url?: string }>;
}

async function isAlreadyListed(
  requestUrl: string,
  registryUrl: string
): Promise<boolean> {
  try {
    const response = await fetch(new URL("/directory.json", requestUrl), {
      cache: "no-store",
    });
    if (!response.ok) return false;
    const directory = (await response.json()) as DirectoryFile;
    const normalized = normalizeRegistryUrl(registryUrl);
    return directory.registries.some(
      (entry) =>
        (entry.registry_url &&
          normalizeRegistryUrl(entry.registry_url) === normalized) ||
        normalizeRegistryUrl(entry.url) === normalized
    );
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Submission storage not configured. Try again later." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: "Request body must be valid JSON.",
        docs: DOCS_URL,
      },
      { status: 400 }
    );
  }

  const parsed = submissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed. Fix the fields below and POST again.",
        fields: parsed.error.flatten().fieldErrors,
        docs: DOCS_URL,
      },
      { status: 400 }
    );
  }

  if (await isAlreadyListed(request.url, parsed.data.registry_url)) {
    return NextResponse.json(
      {
        error:
          "This registry is already listed on registry.directory. No action needed.",
        docs: DOCS_URL,
      },
      { status: 409 }
    );
  }

  try {
    const { entry, created } = await upsertSubmission(parsed.data);
    return NextResponse.json(
      {
        success: true,
        id: entry.id,
        status: entry.status,
        message: created
          ? "Submission received and queued for review. A maintainer audits every submission (the registry must resolve with real, installable content) and you will see your registry listed once approved."
          : "Submission updated. The pending entry now reflects the fields you just sent.",
        update_hint:
          "To change this submission, POST again with the same registry_url — it updates in place.",
        docs: DOCS_URL,
      },
      { status: created ? 201 : 200 }
    );
  } catch (error) {
    console.error("[submissions] API error:", error);
    return NextResponse.json(
      { error: "Failed to save submission. Try again later." },
      { status: 500 }
    );
  }
}
