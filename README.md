![registry.directory](https://registry.directory/opengraph-image)

# registry.directory

The discovery layer for the shadcn/ui registry ecosystem. It indexes **79 public
registries and ~27,000 components** so you can find the one you need without
knowing which registry it lives in — then install it with the shadcn CLI, from
the origin, as usual.

**[registry.directory](https://registry.directory)**

The official shadcn registry index answers *does this registry exist?* This one
answers *what is in it, and does it still resolve?*

## For agents

The site is readable without a browser. Every surface below is a plain document
at a stable URL — no key, no account, no rate limit.

| Surface | What it is |
|---|---|
| [`/llms.txt`](https://registry.directory/llms.txt) | What the site is and when to use it, in prose |
| [`/items.json`](https://registry.directory/items.json) | Every indexed item — name, type, description, registry |
| [`/directory.json`](https://registry.directory/directory.json) | Every listed registry and its index URL |
| [`/openapi.json`](https://registry.directory/openapi.json) | The submission API, described |
| [`/r/…`](https://registry.directory/r/registry.json) | One aggregated registry across the whole catalog, for the shadcn CLI |

Any item page also answers in Markdown — append `.md` to its URL to get the
component's source and dependencies as one document, instead of crawling the
origin registry file by file.

The full picture lives at **[registry.directory/docs](https://registry.directory/docs)**.

## Get your registry listed

The complete contract is
**[how-to-submit.md](https://registry.directory/how-to-submit.md)** — fields,
requirements, and what review checks. Three ways in, same result:

- **The form**, on the site.
- **One HTTP POST** to `/api/submit`. No account, no fork. This is the path an
  agent takes.
- **A pull request** against
  [`apps/web/public/directory.json`](apps/web/public/directory.json).

What review actually asks is that your registry **resolves honestly**: item URLs
return real installable source, or — if items are behind a license — the index
says so instead of quietly returning empty files. A paid registry is welcome. A
registry that looks free and isn't, is not.

## Running it

```bash
pnpm install
pnpm dev
```

Node 24, pnpm 10. That's the whole setup — the site needs no secrets to run,
because it reads its data from disk.

```bash
pnpm build          # production build
pnpm lint           # eslint, all packages
pnpm --filter web typecheck
pnpm --filter web test
```

## How it works

**Nothing running in production fetches a registry.** Not during the build, not
at request time.

An indexer runs locally, talks to all 79 origins, and writes what it saw to
`apps/web/data/` — item metadata and file paths, never file content. That
directory is committed. The site reads it and nothing else, which is why a
registry having a bad afternoon cannot empty a page that worked yesterday: the
last good view stays on disk, and the manifest records that it is a carry-forward.

```bash
cd apps/web
pnpm index                 # refresh every view (~3 min)
pnpm index --only=<key>    # refresh one
pnpm views:check           # the guard, also run before every build
```

`views:check` fails the build on data that contradicts itself — counts that
don't match, duplicate entries, views with no directory entry behind them.
Adding a registry to `directory.json` without indexing it is caught there rather
than shipped.

Two things do reach the network at request time, both by design: an item's
source code, fetched from its origin when a reader opens it, and the `/r` proxy.

More detail on the indexer and the guard in
[`apps/web/scripts/README.md`](apps/web/scripts/README.md).

## Built with

Next.js 15, React 19, Tailwind v4, and shadcn/ui itself, in a Turborepo
monorepo. `apps/web` is the site; `packages/ui` holds the components.

## License

MIT © [Ronny Badilla](https://github.com/rbadillap)
