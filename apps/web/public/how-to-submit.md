# How to submit a registry to registry.directory

You are (or are acting for) the author of a [shadcn/ui component registry](https://ui.shadcn.com/docs/registry). This document is the complete contract for getting it listed on [registry.directory](https://registry.directory). One HTTP POST is all it takes — no account, no fork, no pull request.

Everything you submit is public by design: accepted registries are listed in a public [directory.json](https://registry.directory/directory.json), and pending submissions are reviewable data, not private records.

## Prerequisites

Your registry must:

1. Be publicly reachable over **https**.
2. Serve a `registry.json` index conforming to the [registry.json schema](https://ui.shadcn.com/docs/registry/registry-json), with a non-empty `items` array.
3. Resolve honestly: individual item JSONs (see the [registry-item schema](https://ui.shadcn.com/docs/registry/registry-item-json)) must return real, installable content — actual source code in `files[].content` — or, if items are gated behind a license/paywall, the gating must be declared in the index rather than silently returning empty files. Submissions that don't resolve are rejected.

Before submitting, verify yourself: fetch your `registry.json` and 2–3 individual item URLs and confirm they return what `npx shadcn@latest add <item-url>` ([CLI docs](https://ui.shadcn.com/docs/cli)) would need. If you haven't built the registry yet, start from the [shadcn registry guide](https://ui.shadcn.com/docs/registry/getting-started) or the [registry template](https://github.com/shadcn-ui/registry-template).

## Fields

Derive every field from data you already control. Fetch your own `registry.json` if you need `name` or homepage values. The accepted entry ends up in the directory following [this JSON schema](https://registry.directory/schemas/directory.json).

| Field | Required | What to send |
|---|---|---|
| `name` | yes | Display name of the registry (max 100 chars), e.g. `"usva."` |
| `description` | yes | One sentence describing what the registry provides (max 300 chars) |
| `url` | yes | Homepage, https, e.g. `"https://example.com/"` |
| `registry_url` | yes | Direct https URL to the `registry.json` index. **This is the unique key of your submission** — updates and deduplication match on it |
| `github_url` | no | Source repository, must start with `https://github.com/` |
| `github_profile` | no | Avatar URL, typically `https://github.com/<owner>.png` |

## Submit

```bash
curl -X POST https://registry.directory/api/submit \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Example UI",
    "description": "Composable data-viz components built on the shadcn registry standard.",
    "url": "https://example.com/",
    "registry_url": "https://example.com/r/registry.json",
    "github_url": "https://github.com/acme/example-ui",
    "github_profile": "https://github.com/acme.png"
  }'
```

## Responses

| Status | Meaning | What to do |
|---|---|---|
| `201` | Submission created and queued for review | Done. Save the returned `id` and `submission_token` — the token is the only credential for updating this submission and is shown exactly once |
| `200` | Existing pending submission updated in place | Done |
| `400` | Body is not valid JSON, or field validation failed | Read `fields` in the response — each key lists exactly what is wrong — fix and POST again |
| `403` | A pending submission exists for this `registry_url` and the `submission_token` is missing or wrong | Retry with the token from the creation response. Lost it? The pending version will be reviewed as-is |
| `409` | This registry is already listed, or a pending submission exists and updates are disabled | Nothing to do |
| `413` | Body larger than 10 KB | A submission is a handful of short fields — trim and retry |
| `503` | Storage temporarily unavailable | Retry later |
| `500` | Server error | Retry later; if persistent, open an issue at [rbadillap/registry.directory](https://github.com/rbadillap/registry.directory/issues) |

## Updating a submission

POST again with the same `registry_url`, all fields, plus the `submission_token` you received on creation:

```bash
curl -X POST https://registry.directory/api/submit \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Example UI",
    "description": "An improved description.",
    "url": "https://example.com/",
    "registry_url": "https://example.com/r/registry.json",
    "submission_token": "<token from the 201 response>"
  }'
```

The pending submission is replaced by the new payload. The token exists so only the original submitter can touch a pending submission — without it, updates are rejected but the original submission stays intact and will be reviewed.

## What happens after you submit

1. A maintainer's agent audits the submission: it fetches your `registry.json` and several individual items, and verifies they resolve with real content (the criterion in [Prerequisites](#prerequisites)).
2. A human maintainer makes the final decision.
3. On approval, your registry is committed to the directory and appears on the site after the next build. Review typically takes a few days.

Questions or corrections after listing: open an issue or PR at [rbadillap/registry.directory](https://github.com/rbadillap/registry.directory).

## References

- [shadcn registry docs](https://ui.shadcn.com/docs/registry) — what a registry is and how distribution works
- [registry.json schema](https://ui.shadcn.com/docs/registry/registry-json) — the index your `registry_url` must serve
- [registry-item.json schema](https://ui.shadcn.com/docs/registry/registry-item-json) — what each item must return
- [Getting started](https://ui.shadcn.com/docs/registry/getting-started) · [registry template](https://github.com/shadcn-ui/registry-template) — build a registry from scratch
- [shadcn CLI](https://ui.shadcn.com/docs/cli) — how consumers install from your registry
- [directory.json schema](https://registry.directory/schemas/directory.json) — the shape of an accepted directory entry
