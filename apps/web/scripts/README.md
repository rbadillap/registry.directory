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
                          description, categories, dependencies, cssVars and
                          file PATHS. Never file content.
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
retrying. `401/402/403/404/410` are definitive answers: paywalled, private, or
gone. Retrying those spends minutes to be told the same thing, so they are
left out of the suggested command.

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

## Daily loop

```bash
pnpm index                      # refresh data/
git add apps/web/data && git commit -m "chore(data): reindex"
vercel --prod                   # deploy when the data warrants it
```

There is no cron. A deploy is an event you trigger, not a schedule: the site
is rebuilt because the data changed, not because a clock struck six.
