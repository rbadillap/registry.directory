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
  registries: Array<{ url: string; registry_url?: string; namespace?: string }>;
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

// A registry is "already listed" when EITHER of the submitted identifiers
// (registry_url or homepage url) matches EITHER identifier of a listed entry —
// 31 of 65 entries have no registry_url, so matching only on it lets anyone
// re-submit them under a fresh registry_url.
async function isAlreadyListed(
  requestUrl: string,
  submission: { url: string; registry_url: string; namespace?: string }
): Promise<boolean> {
  try {
    const response = await fetch(directoryJsonUrl(requestUrl), {
      cache: "no-store",
    });
    if (!response.ok) return false;
    const directory = (await response.json()) as DirectoryFile;
    const submitted = [submission.registry_url, submission.url].map(
      normalizeRegistryUrl
    );
    return directory.registries.some((entry) => {
      const listed = [entry.registry_url, entry.url]
        .filter((u): u is string => Boolean(u))
        .map(normalizeRegistryUrl);
      if (listed.some((identifier) => submitted.includes(identifier)))
        return true;
      // A namespace belongs to exactly one listed registry — claiming a
      // listed one under a fresh URL is impersonation, not a new submission.
      return Boolean(
        submission.namespace && entry.namespace === submission.namespace
      );
    });
  } catch {
    return false;
  }
}

const OFFICIAL_INDEX_URL = "https://ui.shadcn.com/r/registries.json";

function rootDomain(hostname: string): string {
  return hostname.replace(/^www\./, "").toLowerCase();
}

// Intake verification of a namespace claim against the official shadcn
// registry index: the handle must exist there AND its homepage must live on
// the same domain as the submitted url. Fails open when the official index
// is unreachable — the review audit re-verifies every claim regardless.
async function namespaceClaimError(
  namespace: string,
  submittedUrl: string
): Promise<string | null> {
  try {
    const response = await fetch(OFFICIAL_INDEX_URL, {
      next: { revalidate: 3600 },
    });
    if (!response.ok) return null;
    const index = (await response.json()) as Array<{
      name?: string;
      homepage?: string;
    }>;
    const official = index.find((entry) => entry.name === namespace);
    if (!official) {
      return `namespace ${namespace} is not listed in the official shadcn registry index. Omit the field, or register there first.`;
    }
    const officialDomain = official.homepage
      ? rootDomain(new URL(official.homepage).hostname)
      : null;
    const submittedDomain = rootDomain(new URL(submittedUrl).hostname);
    if (officialDomain && officialDomain !== submittedDomain) {
      return `namespace ${namespace} belongs to ${officialDomain} in the official shadcn registry index, but the submitted url is on ${submittedDomain}. A namespace can only be claimed by its own site.`;
    }
    return null;
  } catch {
    return null;
  }
}

function bearerToken(request: Request): string | undefined {
  const header = request.headers.get("authorization");
  const match = header?.match(/^Bearer\s+(.+)$/i);
  return match?.[1];
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

  if (await isAlreadyListed(request.url, parsed.data)) {
    return NextResponse.json(
      {
        error:
          "This registry is already listed on registry.directory. No action needed.",
        docs: DOCS_URL,
      },
      { status: 409 }
    );
  }

  if (parsed.data.namespace) {
    const claimError = await namespaceClaimError(
      parsed.data.namespace,
      parsed.data.url
    );
    if (claimError) {
      return NextResponse.json(
        { error: claimError, fields: { namespace: [claimError] }, docs: DOCS_URL },
        { status: 422 }
      );
    }
  }

  try {
    const existing = await getSubmission(parsed.data.registry_url);

    if (existing) {
      const providedToken = bearerToken(request);

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

      if (!providedToken) {
        return NextResponse.json(
          {
            error:
              "A submission for this registry_url is already pending review. To update it, send the submission token as an Authorization: Bearer header.",
            docs: `${DOCS_URL}#updating-a-submission`,
          },
          { status: 403 }
        );
      }

      if (!isValidSubmissionToken(parsed.data.registry_url, providedToken)) {
        return NextResponse.json(
          {
            error:
              "The Authorization bearer token does not match this registry_url. Updates require the token returned when the submission was created.",
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
                "Keep this token — it is shown exactly once. To update the pending submission, POST again with the same registry_url and send the token as an Authorization: Bearer header.",
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
