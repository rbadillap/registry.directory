import { hasOnlyRenderableFiles } from "./file-utils";
import type { DirectoryEntry } from "./types";
import type { IndexedItem } from "./items-index";
import {
  registryBasePath,
  parseGithubRef,
  loadRegistryIndex,
} from "./resolve-registry";

async function fetchItemsForRegistry(
  registry: DirectoryEntry
): Promise<IndexedItem[]> {
  // Entries with neither github_url nor namespace have no route on the site
  const basePath = registryBasePath(registry);
  if (!basePath) return [];

  const gh = parseGithubRef(registry.github_url);
  const avatarUrl = gh
    ? `https://github.com/${gh.owner}.png`
    : (registry.github_profile ?? null);

  const data = await loadRegistryIndex(registry);
  if (!data?.items || data.items.length === 0) return [];

  return data.items
    .filter((item) => hasOnlyRenderableFiles(item.files))
    .map((item) => ({
      name: item.name,
      type: item.type,
      description: item.description || "",
      categories: item.categories || [],
      registry: {
        name: registry.name,
        basePath,
        avatarUrl,
      },
    }));
}

// The home's cross-registry search index, flattened from the committed views
// at build time and handed to DirectoryTabs as a server prop. The older plan
// here was to persist this to Vercel Blob once a second consumer appeared;
// BAD-138 removed the reason — every consumer can rebuild it from data/ at
// zero network cost, so blob persistence would only add a second copy that
// can disagree with the first.
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
    const key = `${item.registry.basePath}/${item.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
