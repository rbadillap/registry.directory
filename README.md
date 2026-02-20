![registry.directory](https://registry.directory/opengraph-image)

# registry.directory

Discover, preview, and install components from 40+ shadcn/ui registries — all in one place.

[registry.directory](https://registry.directory) is a community-driven directory that indexes shadcn/ui-compatible registries so you can find components across the ecosystem without visiting each registry individually.

## Features

**Cross-registry search** — Search for "button", "accordion", or "chart" and see results from every registry, ranked by relevance and interleaved so no single registry dominates. Multi-term queries like "button tailark" narrow results to a specific registry.

**IDE-style previewer** — Browse any registry's components in a dark, code-first viewer. See file contents, component metadata, and copy install commands directly.

**One-command install** — Every component links back to its source registry. Find what you need, then install it:

```bash
npx shadcn@latest add https://registry.com/r/component-name.json
```

**Enriched cards** — Each registry card shows component count, categories, GitHub stars, and last commit time so you can evaluate quality at a glance.

## Add your registry

1. Make sure your registry is not already listed.
2. Ensure your registry uses **shadcn** as its distribution method
   (e.g., `npx shadcn@latest add https://your-registry.com/{component}`).
3. Your registry must have a publicly accessible `registry.json` file at `/r/registry.json`
   (e.g., `https://your-registry.com/r/registry.json`).
4. Add your entry at the bottom of the `registries` array in [`directory.json`](https://github.com/rbadillap/registry.directory/blob/main/apps/web/public/directory.json).

### Registry requirements

Your registry must be publicly accessible and follow the shadcn registry format:

- **Registry index**: `https://your-site.com/r/registry.json` (required)
- **Component files**: `https://your-site.com/r/{component-name}.json` (required)
- All files must be publicly accessible (no authentication required)

If your registry URL differs from the default `/r/registry.json` path, specify a custom `registry_url`:

```json
{
  "name": "My Registry",
  "description": "A custom registry for shadcn/ui components.",
  "url": "https://myregistry.com/",
  "registry_url": "https://myregistry.com/custom-path/registry.json"
}
```

### Optional: GitHub profile and repository

Add `github_url` and `github_profile` to display a GitHub avatar and repository link on your card:

```json
{
  "name": "My Registry",
  "description": "A custom registry for shadcn/ui components.",
  "url": "https://myregistry.com/",
  "github_url": "https://github.com/username/repo",
  "github_profile": "https://github.com/username.png"
}
```

This adds your profile picture as a clickable avatar, a GitHub icon linking to your repository, and star/commit metadata on your card.

## Development

```bash
pnpm install
pnpm dev        # starts the web app on localhost:3000
pnpm build      # full production build
pnpm lint       # lint all packages
```

This is a [Turborepo](https://turbo.build) monorepo with the main app at `apps/web` and shared UI at `packages/ui`.

## License

MIT
