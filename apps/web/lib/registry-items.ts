import { registryFetch, getRegistryJsonUrl } from "./fetch-utils";
import { hasOnlyRenderableFiles } from "./file-utils";
import type { Registry } from "./registry-types";
import type { DirectoryEntry } from "./types";
import type { IndexedItem } from "./items-index";

function parseGitHubOwnerRepo(
  githubUrl: string
): { owner: string; repo: string } | null {
  const match = githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) return null;
  const owner = match[1];
  const repo = match[2]?.replace(/\.git$/, "");
  if (!owner || !repo) return null;
  return { owner, repo };
}

async function fetchItemsForRegistry(
  registry: DirectoryEntry
): Promise<IndexedItem[]> {
  const url = getRegistryJsonUrl(registry);
  if (!url || !registry.github_url) return [];

  const parsed = parseGitHubOwnerRepo(registry.github_url);
  if (!parsed) return [];

  const response = await registryFetch(url, {
    timeout: 10000,
    next: { revalidate: 86400 },
  });

  if (!response.ok) return [];

  const data = (await response.json()) as Registry;
  if (!data.items || data.items.length === 0) return [];

  return data.items
    .filter((item) => hasOnlyRenderableFiles(item.files))
    .map((item) => ({
      name: item.name,
      type: item.type,
      description: item.description || "",
      categories: item.categories || [],
      registry: {
        name: registry.name,
        owner: parsed.owner,
        repo: parsed.repo,
      },
    }));
}

// TODO: Foundation C currently delivers the items index as a server prop (build-time only).
// If a second consumer appears (e.g. overview page search, similar component suggestions),
// migrate to Vercel Blob persistence — same pattern as github-stats.ts.
// See BREAKTHROUGHS.md #1 for the precedent (Phase 1 no Blob → Phase 2 Blob).
export async function fetchAllRegistryItems(
  registries: DirectoryEntry[]
): Promise<IndexedItem[]> {
  const results = await Promise.allSettled(
    registries.map((registry) => fetchItemsForRegistry(registry))
  );

  const allItems: IndexedItem[] = [];

  for (const result of results) {
    if (result.status === "fulfilled") {
      allItems.push(...result.value);
    }
  }

  // Deduplicate: some registries register the same name multiple times
  // (e.g. style variants like "badge-style-default"). Keep the first occurrence.
  const seen = new Set<string>();
  return allItems.filter((item) => {
    const key = `${item.registry.owner}/${item.registry.repo}/${item.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
