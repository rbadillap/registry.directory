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
| `namespace` | no | Your official [shadcn registry index](https://ui.shadcn.com/docs/registry/registry-index) handle, e.g. `"@acme"` (pattern `@[a-z0-9][a-z0-9-]*`). Only send it if your registry is actually listed there — it is verified during review, and it powers the namespaced install command on your landing page |
| `featured` | no | 1–6 item `name`s from your own `registry.json`, in display order. They become the Featured section of your landing page and the item shown in the install command. Every name is verified against your index during review; names that don't resolve are dropped. Omit the field entirely rather than sending an empty array |
| `pro` | no | Declare it only if you sell a paid tier. An object with **all five** booleans: `pro_blocks`, `templates`, `figma_kit`, `mcp_agent`, `team_license`. `false` values are data (they render as explicit ✗ on your landing page), so declare the five honestly — claims are audited against your site during review |

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
    "github_profile": "https://github.com/acme.png",
    "namespace": "@example",
    "featured": ["area-chart", "sparkline", "data-table"],
    "pro": {
      "pro_blocks": true,
      "templates": true,
      "figma_kit": false,
      "mcp_agent": false,
      "team_license": true
    }
  }'
```

The last three fields are optional — a plain open-source registry submits only the first six.

## Responses

| Status | Meaning | What to do |
|---|---|---|
| `201` | Submission created and queued for review | Done. Save the returned `id` and `submission_token` — the token is the only credential for updating this submission and is shown exactly once |
| `200` | Existing pending submission updated in place | Done |
| `400` | Body is not valid JSON, or field validation failed | Read `fields` in the response — each key lists exactly what is wrong — fix and POST again |
| `403` | A pending submission exists for this `registry_url` and the `Authorization: Bearer` token is missing or wrong | Retry with the token from the creation response sent as a header. Lost it? The pending version will be reviewed as-is |
| `409` | This registry is already listed (by URL or by `namespace`), or a pending submission exists and updates are disabled | Nothing to do |
| `422` | The `namespace` claim failed verification against the official shadcn registry index | Either the handle doesn't exist there or it belongs to a different domain than your `url`. Omit the field, or fix the claim |
| `413` | Body larger than 10 KB | A submission is a handful of short fields — trim and retry |
| `503` | Storage temporarily unavailable | Retry later |
| `500` | Server error | Retry later; if persistent, open an issue at [rbadillap/registry.directory](https://github.com/rbadillap/registry.directory/issues) |

## Updating a submission

POST again with the same `registry_url` and all fields, sending the `submission_token` you received on creation as an `Authorization: Bearer` header — the token never travels in the body:

```bash
curl -X POST https://registry.directory/api/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token from the 201 response>" \
  -d '{
    "name": "Example UI",
    "description": "An improved description.",
    "url": "https://example.com/",
    "registry_url": "https://example.com/r/registry.json"
  }'
```

The pending submission is replaced by the new payload. The token exists so only the original submitter can touch a pending submission — without it, updates are rejected but the original submission stays intact and will be reviewed.

## What happens after you submit

1. A maintainer's agent audits the submission: it fetches your `registry.json` and several individual items, and verifies they resolve with real content (the criterion in [Prerequisites](#prerequisites)). If you sent the optional fields, those are audited too: `namespace` is checked against the official shadcn registry index, every `featured` name is checked against your index, and each `pro` boolean is checked against what your site actually offers.
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
