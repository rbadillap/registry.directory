import { groupItemsByCategory } from "./registry-mappings";
import { loadRegistryIndex } from "./resolve-registry";
import type { DirectoryEntry, RegistryStats } from "./types";

async function fetchStatsForRegistry(
  registry: DirectoryEntry
): Promise<RegistryStats | null> {
  const data = await loadRegistryIndex(registry);
  if (!data?.items || data.items.length === 0) return null;

  const grouped = groupItemsByCategory(data.items);

  const categories = Array.from(grouped.entries())
    .map(([slug, items]) => ({ slug, count: items.length }))
    .sort((a, b) => b.count - a.count);

  const topItems = data.items.slice(0, 5).map((item) => item.name);

  return {
    totalItems: data.items.length,
    categories,
    topItems,
  };
}

export async function fetchAllRegistryStats(
  registries: DirectoryEntry[]
): Promise<Record<string, RegistryStats>> {
  const results = await Promise.allSettled(
    registries.map(async (registry) => {
      const stats = await fetchStatsForRegistry(registry);
      return { url: registry.url, stats };
    })
  );

  const statsRecord: Record<string, RegistryStats> = {};

  for (const result of results) {
    if (result.status === "fulfilled" && result.value.stats) {
      statsRecord[result.value.url] = result.value.stats;
    }
  }

  return statsRecord;
}
