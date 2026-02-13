import { registryFetch } from "./fetch-utils";
import { groupItemsByCategory } from "./registry-mappings";
import type { Registry } from "./registry-types";
import type { DirectoryEntry, RegistryStats } from "./types";

function getRegistryJsonUrl(registry: DirectoryEntry): string | null {
  if (registry.registry_url) {
    return registry.registry_url;
  }

  if (registry.url) {
    return `${registry.url.replace(/\/$/, "")}/r/registry.json`;
  }

  return null;
}

async function fetchStatsForRegistry(
  registry: DirectoryEntry
): Promise<RegistryStats | null> {
  const url = getRegistryJsonUrl(registry);
  if (!url) return null;

  try {
    const response = await registryFetch(url, {
      timeout: 5000,
      next: { revalidate: 86400 },
    });

    if (!response.ok) return null;

    const data = (await response.json()) as Registry;
    if (!data.items || data.items.length === 0) return null;

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
  } catch (error) {
    console.error(
      `[registry-stats] Failed to fetch stats for ${registry.name}:`,
      error
    );
    return null;
  }
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
