![screenshot](https://registry.directory/opengraph-image)

### How to suggest a registry?

1. Make sure the registry is not already listed in the directory.
2. Ensure the registry uses **shadcn** as its distribution method
   (e.g., `npx shadcn@latest add https://custom-registry.com/{component}`).
3. **Your registry must have a publicly accessible `registry.json` file at `/r/registry.json`**
   (e.g., `https://custom-registry.com/r/registry.json`).
4. Add the registry entry at the bottom of the `registries` array in the [`directory.json`](https://github.com/rbadillap/registry.directory/blob/main/apps/web/public/directory.json) file.

### Registry Requirements

Your registry must be publicly accessible and follow the shadcn registry format:

- **Registry index**: `https://your-site.com/r/registry.json` (required)
- **Component files**: `https://your-site.com/r/{component-name}.json` (required)
- All files must be publicly accessible (no authentication required)

If your registry URL is different from the default `/r/registry.json` path, you can specify a custom `registry_url`:

```json
{
  "name": "My Registry",
  "description": "A custom registry for shadcn/ui components.",
  "url": "https://myregistry.com/",
  "registry_url": "https://myregistry.com/custom-path/registry.json"
}
```

### Adding GitHub Profile and Repository

To make your card stand out with a GitHub avatar and link, you can add optional `github_url` and `github_profile` fields to your registry entry.

**Example with GitHub:**
```json
{
  "name": "shadcn/ui",
  "description": "The official registry for shadcn/ui components.",
  "url": "https://ui.shadcn.com/",
  "github_url": "https://github.com/shadcn-ui/ui",
  "github_profile": "https://github.com/shadcn.png"
}
```

**Example without GitHub (fallback to icon):**
```json
{
  "name": "My Registry",
  "description": "A custom registry for shadcn/ui components.",
  "url": "https://myregistry.com/"
}
```

**How to get your GitHub profile image URL:**
- Format: `https://github.com/{username}.png`
- Example: If your GitHub username is `rbadillap`, use `https://github.com/rbadillap.jpg`

**Result:**
When you include `github_url` and `github_profile`, your card will display:
- [x] Your GitHub profile picture as an avatar (clickable, links to your GitHub profile)
- [x] A GitHub icon next to the external link icon (clickable, links to your repository)
- [x] Enhanced visual presentation

![Card with GitHub profile](apps/web/public/card.png)
