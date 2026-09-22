# scripts/

Everything here runs **locally**, never in a Vercel build and never in a
Function. That split is the whole point: this is where talking
to 75 third-party registries is allowed, because this is where waiting out a
rate limit is free.

The site itself only ever reads files under `apps/web/data/`.

| script | command | what it is |
| --- | --- | --- |
| `index.mjs` | `pnpm index` | The indexer. Produces everything the site reads. |
| `views-check.mjs` | `pnpm views:check` | The prebuild guard. Refuses to build against dishonest data. |
| `list-pending-submissions.mjs` | `node --env-file=.env.local scripts/list-pending-submissions.mjs` | Lists pending registry submissions from Blob. Unrelated to the data layer. |

Tests run with `pnpm test` (node:test, no dependencies). They cover pagination,
which no registry in the directory currently exercises — every origin answers
its whole catalog in one response — and which is therefore the easiest part of
the indexer for a regression to live in unnoticed.

---

## The indexer — `pnpm index`

One command, four steps, one output directory.

```
pnpm index                    full run, no waiting          (~3 min)
pnpm index --only=key,key     refresh just those views      (seconds)
pnpm index --retry            add a patient retry pass      (minutes longer)
```

### What it writes

```
apps/web/data/
  registries/{key}.json   one slim view per registry: items with name, type,
                          description, categories, dependencies, cssVars,
                          font (registry:font only), file PATHS and — when
                          the origin refuses the item — `unavailable`.
                          Never file content.
  github.json             stars and last-push date per github_url
  collections.json        the home's groupings, each carrying its own criterion
  shipped.json            day-to-day diff of item names (the novedades ticker)
  manifest.json           what this run saw: counts, and one record per entry
                          in public/directory.json with its status
```

It also archives a raw snapshot to Vercel Blob at `snapshots/{YYYY-MM-DD}.json`.
That archive is **not** a site data source — nothing reads it at build or
request time. It exists because nobody else on the internet keeps a history of
registry indexes (the Wayback Machine holds zero captures of any
`registry.json`), and `shipped.json` needs that history to compute a diff.
Snapshots are append-only: a run never overwrites a day already archived.

### The four steps

1. **registries** — fetch all 75 indexes, write one view each, probe whether
   the origin still resolves individual items (`resolvable` in the manifest).
   The probe also settles *where* items live (`itemBase` in the view): the
   convention — next to the index — is tried first, then the other layouts
   in `itemBaseCandidates` (`scripts/lib/data-io.mjs`). Everything that
   fetches an item afterwards reads `itemBase` from the view. Then every
   item of a resolvable registry is asked for once, and the ones the origin
   refuses are marked (`unavailable` on the item — see below).
2. **github** — refresh stars and last-push dates. Skipped on a partial run.
3. **derived** — compute `collections.json` from the views just written, and
   `shipped.json` by diffing recent snapshots.
4. **manifest** — write the accounting record for the run.

### Status of a view

The status describes **our local copy of a registry's catalog**, not the
registry and not its components:

| status | meaning |
| --- | --- |
| `ok` | fetched successfully in this run — the copy is current |
| `reused` | the origin failed, so the copy from an earlier run was kept |
| `missing` | the origin failed and there is no earlier copy to fall back on |

`reused` is why a bad afternoon at one origin cannot empty a page that used to
work. `missing` only happens to a registry that has never been indexed
successfully.

### The item probe: what `/r` may list

The registry-level sample above answers "does this origin serve anything?".
The item probe answers, for each item, "will the origin serve *this one* to an
anonymous request?" — because `/r` proxies installs to the origin, and an item
the origin refuses is a search result that installs as our 502. The official
shadcn registry index samples our catalog daily and scores each of those
against `@registrydirectory`, not against the origin.

One request per item, body discarded. The view records only a definitive
refusal, on the item itself:

| `unavailable` | the origin answered | what it means |
| --- | --- | --- |
| `"gated"` | 401, 402, 403 | the item exists behind a paywall or a login |
| `"gone"` | 404, 410, or a 2xx web page where the JSON should be | the index lists an item the origin no longer serves |

Anything else — 429, 5xx, a timeout — is retried briefly and then left
**unmarked**: a rate limit is a request to wait, not an answer about the item,
and the view must not record a bad afternoon as a paywall. An unmarked item is
listed.

The catalog (`lib/catalog.ts`) leaves marked items out of `/r`. The site keeps
showing them: a paywalled block is still a block worth finding, it just cannot
be installed through an aggregator. The manifest carries the counts (`gated`,
`gone`, per registry and in `counts`) and the guard checks them against the
files.

A registry whose sample says the origin serves nothing (`resolvable: false`)
is not probed item by item — it is already out of `/r`, and a thousand more
requests would only confirm the sample.

**Reused views are re-probed when the index failed definitively** (404, a
paywall, a page that is not JSON): an index that moved usually took its items
with it, and a carried-forward view that still lists them as installable keeps
`/r` promising what the origin stopped serving. An index that answered 429 or
5xx, or could not be reached, is left alone — yesterday's verdicts are the best
information there is, and probing a throttled host item by item earns nothing
but more 429s.

**The probe never waits out a rate limit** — same rule as the main run. An
origin that answers 429 with a `Retry-After` beyond 30 seconds, or keeps
answering 429 after the retries, has said all it will say today: the rest of
its items are left unprobed, and therefore listed, and the manifest records
how many (`unprobed`, per registry and in `counts`). That number is what tells
a view where nothing is marked from a view nobody could ask. Shadcn Blocks is
the standing example: an hourly quota per IP and four thousand items, so a
single run can verify only a few dozen.

Two things make a throttled origin converge over runs instead of re-asking
the same items forever. The probe starts at a random item each run, so a
quota is spent on different items every time. And an item the run could not
ask **keeps the verdict it earned in an earlier run** — the same reasoning
as a reused view: yesterday's answer beats no answer, and the next run that
reaches the item corrects it. A fresh answer always replaces an old verdict,
and an item the origin now serves loses its mark. `pnpm index --only=<key>`
is the cheap way to spend another quota on one origin.

Cost: about one request per item in the directory, four in flight per origin.
That is the price of a verdict per item rather than per registry, and it is
paid here, on a laptop, never on Vercel. A full run takes about 30 minutes
now, up from 3.

### Quarantine: why the main run never waits

An origin that answers `429` (rate limited) or a `5xx` has usually been
answering that for days. Making every run sit through a cooldown for the same
few sites turns a 3-minute job into an 8-minute one and changes nothing.

So the main run **records and moves on**, then prints the command to come back
for the ones worth a second chance:

```
MISSING (7):
  cult-ui             HTTP 429 (after 5 attempts) — Cult UI
  ...

to retry the 4 throttled one(s) — patient, minutes long:
  pnpm index --only=cult-ui,diceui,elevenlabs-ui,motion-primitives --retry

3 answered definitively (gated or gone); retrying will not change it: ...
```

The split is deliberate. `429` and `5xx` mean "wait" or "my fault" — worth
retrying. `401/402/403/404/410`, and a 200 that is not JSON, are definitive
answers: paywalled, private, gone, or a web page. Retrying those spends
minutes to be told the same thing, so they are left out of the suggested
command (`DEFINITIVE_ERROR` in `scripts/lib/data-io.mjs` is the one list).

`--retry` adds two rounds with a 120s cooldown, hitting the throttled origins
one at a time (retrying them in parallel is what earns a 429 in the first
place).

### Recovering one registry

```bash
pnpm index --only=cult-ui --retry
```

A partial run merges into the existing manifest and deliberately **skips**
the GitHub step, the orphan prune and the snapshot archive — a run that only
looked at one registry must not prune views it never inspected, nor archive a
snapshot claiming to be the whole ecosystem.

### Requirements

`apps/web/.env.local` with `BLOB_READ_WRITE_TOKEN` (snapshot archive, shipped
history) and `GITHUB_TOKEN` (stars, last push). The file is gitignored.

---

## The guard — `pnpm views:check`

Runs automatically before every build via pnpm's `prebuild` hook. Nobody has to
remember it.

It fails the build when `data/` **lies**: a directory entry with no record in
the manifest, a JSON that does not parse, or counts that disagree with the
files actually present. It does **not** fail on missing views that the manifest
declares honestly — an origin being unreachable is a fact about the internet,
not a reason to block a deploy, and a permanently gated registry would
otherwise block every build forever.

The distinction it enforces is not "everything is fine" versus "something
failed". It is **honest data** versus **data that misrepresents itself**.

It also prints a note — never an error — once `data/` is more than 14 days
old:

```
views:check  note: data/ was generated 20 days ago (2026-07-31) — run `pnpm index` to refresh it
```

Committed data does not refresh itself. An origin that was down when it was
indexed stays down in `data/` until someone runs the indexer again, and a
registry admitted last week is invisible until then. Working from stale data is a valid
choice; making it by forgetting is not. The note exists so the choice is
always a choice.

```bash
pnpm views:check    # run it by hand
pnpm build          # runs it first, automatically
```

---

## Two rhythms, not one loop

Indexing and deploying are separate acts with separate reasons, and they are
priced separately. Running them together out of habit is what makes them look
like one step.

### Indexing — as often as the record deserves

```bash
pnpm index
git add apps/web/data && git commit -m "chore(data): reindex"
```

This costs nothing on the platform. It reads the registries from a laptop and
writes files.

The reason to do it often is the archive: a snapshot is the only record of what
a registry's catalog held on a given day, and nobody else keeps one. A day
skipped is a day gone. `shipped.json` also diffs consecutive snapshots, so a gap
makes one day claim everything that happened since the last one.

### Deploying — as often as the site needs to know

```bash
vercel --prod
```

This is what costs. A deployment builds every page again, and it starts with an
empty ISR cache, so everything the crawlers had already warmed is written a
second time. Both charges are per deployment, not per day.

Between deployments the site serves the data from the last one. Committed views
can run ahead of what is published, and nothing about the catalog breaks — what
ages is how soon the site hears about a change.

There is no cron. A deploy is an event you trigger, not a schedule: the site is
rebuilt because the data changed enough to be worth publishing, not because a
clock struck six.
