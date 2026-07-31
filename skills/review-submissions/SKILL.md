---
name: review-submissions
description: Audit pending registry submissions for registry.directory and produce an admission verdict for the maintainer. Use this whenever asked to review submissions, check the submission inbox, audit a new registry, review a PR that touches directory.json, or when the maintainer asks what arrived ("what's new?", "anything pending?"). Always follow this procedure instead of improvising a review.
---

# Review Registry Submissions

registry.directory lists shadcn/ui component registries. Anyone can submit one (see `apps/web/public/how-to-submit.md`). Your job is to **audit** each pending submission and report a verdict. You do not admit, reject, merge, or reply to submitters — the maintainer (@rbadillap) makes every final decision and personally writes any public response. This split is deliberate: the audit is mechanical and yours; judgment on edge cases and hospitality toward authors are his.

## The admission criterion

The directory audits **honest resolution, not business models**. A registry is admissible when the URLs it publishes resolve to what they promise:

- **Admissible**: items return real, installable source code in `files[].content` — OR items are gated (license/paywall) and the gating is declared in the index rather than hidden.
- **Not admissible**: index or items that 404, return HTML instead of JSON, contain empty/placeholder file content, or silently gate content while presenting as open.
- **Popularity is irrelevant.** Zero stars, brand-new projects, and third-party submissions (submitter ≠ registry owner) are all acceptable. Only resolution matters.

When a case does not clearly fit (partially gated without declaration, index resolves but many items broken, claims that contradict reality), do not force a verdict — mark it NEEDS_HUMAN with the evidence.

## Step 1 — Gather the inbox

Check both sources; either may have items the other doesn't:

```bash
# API submissions (Vercel Blob), run from apps/web:
node --env-file=.env.local scripts/list-pending-submissions.mjs

# Manual submissions (GitHub PRs that touch directory.json):
gh pr list --state open --json number,title,author,createdAt,files \
  --jq '.[] | select(.files[].path == "apps/web/public/directory.json")'
```

If both are empty, report "no pending submissions" and stop.

## Step 2 — Run the probe on each submission

Never skip steps, and never conclude from the index alone — an index can be healthy while every item is broken.

1. **Index**: fetch `registry_url`. It must return valid JSON with a non-empty `items` array. Record the item count and the mix of types.
2. **Items**: pick 3–5 items spread across different types (ui, block, lib, etc. — not 5 of the same kind). Fetch each item's individual JSON from the same base URL pattern. For each, verify `files[].content` holds real source code: non-trivial length and plausible content for its declared path (a `.tsx` file should read as TypeScript/React). Record per-item file counts and content sizes — they are your evidence.
3. **Declared fields vs reality**: the submitted `name`/`description` must reasonably match what the registry actually serves, and `url` must be a live homepage. Mismatches are a signal of carelessness or misrepresentation — note them.
4. **Source repo**: if `github_url` was provided, confirm the repo exists and is public (`gh repo view owner/repo`). Note whether the submitter appears to be the owner (informative, not required).
5. **Optional v2 claims** — audit each one that was submitted; skip silently the ones that weren't:
   - `namespace`: fetch `https://ui.shadcn.com/r/registries.json` (the official shadcn registry index) and confirm the handle exists there AND its homepage domain matches the submitted `url`. A namespace that isn't in the official index, or that belongs to a different site, is a false claim.
   - `featured`: every name must exist as an exact item `name` in the fetched `registry.json` (case-sensitive). Record which resolve and which don't. One or two unresolved names is sloppiness (note it); mostly-unresolved is misrepresentation.
   - `pro`: each boolean is a claim about what the vendor sells — check the live site (pricing page, homepage). `true` claims need visible evidence (a pro tier, templates for sale, a Figma kit, MCP/agent tooling, a team license tier). A `false` that's visibly true on the site is fine (under-claiming is allowed); a `true` without evidence is not.
   - Any false v2 claim → NEEDS_HUMAN with the evidence. These fields render on the registry's public landing page, so a false claim ships a lie under our name.

## Origin determines scrutiny, not leniency

- **API submissions** (`origin: "api"` in the Blob entry): nobody tested anything by hand before it reached you — the API validates only field format. Your probe is the first and only audit. Apply every step fully.
- **PR submissions**: even when the PR author says they tested an install, run the full probe anyway. Verify, don't trust.

## Step 3 — Report the verdict

Deliver one report for the whole inbox, most recent submission first. For each submission use exactly this structure:

```
### <name> — PASS | FAIL | NEEDS_HUMAN
- Source: api submission <id> | PR #<n>
- Index: <item count> items at <registry_url> (<types summary>)
- Items probed: <name> (<n> files, <total chars>), <name> (…), …
- Fields vs reality: <ok | discrepancies>
- Repo: <exists/public/owner-match | not provided>
- V2 claims: <not submitted | namespace ok/false, featured n/m resolved, pro ok/unsupported claims>
- Notes: <anything the maintainer should weigh — edge cases, oddities, standout quality>
```

End the report with a one-line recommendation per submission. Do not act on it — wait for the maintainer's decision.

## Boundaries

These exist because public actions represent the maintainer personally:

- Never merge a PR, never commit to `directory.json`, never delete a submission blob — those follow the maintainer's decision, not the audit.
- Never post PR comments, issues, or any public reply. If a welcome or rejection message is wanted, draft it, show it, and publish only after explicit approval of the exact text.

## After the maintainer decides

- **Approved**: add the entry to `apps/web/public/directory.json` (match the existing format and the schema in `apps/web/public/schemas/directory.json`), commit on a branch, open a PR for the maintainer unless instructed otherwise. Then delete the pending blob (`submissions/pending/<id>.json`) so the inbox stays truthful.
- **Rejected**: delete the pending blob. Any communication to the author is the maintainer's, per the boundaries above.

## References for the probe

- [registry.json schema](https://ui.shadcn.com/docs/registry/registry-json) — what a valid index looks like
- [registry-item.json schema](https://ui.shadcn.com/docs/registry/registry-item-json) — what a valid item looks like; `files[].content` is where real code lives
- [shadcn CLI](https://ui.shadcn.com/docs/cli) — `npx shadcn@latest add <item-url>` is the consumer behavior the probe simulates
- `apps/web/public/how-to-submit.md` — the contract submitters were given; what they were promised is what you audit against
