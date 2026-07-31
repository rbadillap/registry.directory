import { NextResponse } from "next/server";
import {
  submissionSchema,
  getSubmission,
  saveSubmission,
  submissionToken,
  isValidSubmissionToken,
  normalizeRegistryUrl,
} from "@/lib/submissions";

const DOCS_URL = "https://registry.directory/how-to-submit.md";
const MAX_BODY_BYTES = 10_000;

interface DirectoryFile {
  registries: Array<{ url: string; registry_url?: string }>;
}

// The dedupe source is always the canonical production directory — deriving
// the origin from the incoming request would let a spoofed Host header point
// this server-side fetch at an attacker-controlled URL. Local dev reads its
// own origin so the flow works offline against the local file.
function directoryJsonUrl(requestUrl: string): URL {
  if (process.env.NODE_ENV === "development") {
    return new URL("/directory.json", requestUrl);
  }
  return new URL("https://registry.directory/directory.json");
}

async function isAlreadyListed(
  requestUrl: string,
  registryUrl: string
): Promise<boolean> {
  try {
    const response = await fetch(directoryJsonUrl(requestUrl), {
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

  const contentLength = Number(request.headers.get("content-length"));
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      {
        error: `Request body too large (max ${MAX_BODY_BYTES} bytes). A submission is a handful of short fields.`,
        docs: DOCS_URL,
      },
      { status: 413 }
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
    const existing = await getSubmission(parsed.data.registry_url);

    if (existing) {
      const providedToken =
        typeof body === "object" && body !== null
          ? (body as Record<string, unknown>).submission_token
          : undefined;

      if (!process.env.SUBMISSION_SECRET) {
        return NextResponse.json(
          {
            error:
              "A submission for this registry_url is already pending review and updates are not enabled. The pending version will be reviewed as-is.",
            docs: DOCS_URL,
          },
          { status: 409 }
        );
      }

      if (typeof providedToken !== "string" || providedToken === "") {
        return NextResponse.json(
          {
            error:
              "A submission for this registry_url is already pending review. To update it, include the submission_token field that was returned when it was created.",
            docs: `${DOCS_URL}#updating-a-submission`,
          },
          { status: 403 }
        );
      }

      if (!isValidSubmissionToken(parsed.data.registry_url, providedToken)) {
        return NextResponse.json(
          {
            error:
              "submission_token does not match this registry_url. Updates require the token returned when the submission was created.",
            docs: `${DOCS_URL}#updating-a-submission`,
          },
          { status: 403 }
        );
      }

      const entry = await saveSubmission(parsed.data, existing);
      return NextResponse.json(
        {
          success: true,
          id: entry.id,
          status: entry.status,
          message:
            "Submission updated. The pending entry now reflects the fields you just sent.",
          docs: DOCS_URL,
        },
        { status: 200 }
      );
    }

    const entry = await saveSubmission(parsed.data, null);
    const token = submissionToken(parsed.data.registry_url);
    return NextResponse.json(
      {
        success: true,
        id: entry.id,
        status: entry.status,
        ...(token
          ? {
              submission_token: token,
              update_hint:
                "Keep submission_token if you may want to update this submission — POST again with the same registry_url plus this token.",
            }
          : {}),
        message:
          "Submission received and queued for review. A maintainer audits every submission (the registry must resolve with real, installable content) and you will see your registry listed once approved.",
        docs: DOCS_URL,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[submissions] API error:", error);
    return NextResponse.json(
      { error: "Failed to save submission. Try again later." },
      { status: 500 }
    );
  }
}
