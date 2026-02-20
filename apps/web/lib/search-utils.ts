import type { IndexedItem } from "./items-index";

interface ScoredItem {
  item: IndexedItem;
  score: number;
  registryKey: string;
}

/**
 * Search items with multi-term AND matching, relevance scoring, and
 * round-robin interleaving across registries.
 *
 * - "button" → items named "button" from all registries first, then partials
 * - "button tailark" → Tailark items matching "button"
 * - Exact name matches score highest, registry name matches lowest
 */
export function searchItems(
  items: IndexedItem[],
  query: string
): IndexedItem[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  // 1. Score + filter in one pass
  const scored: ScoredItem[] = [];

  for (const item of items) {
    const name = item.name.toLowerCase();
    const desc = item.description.toLowerCase();
    const regName = item.registry.name.toLowerCase();

    let totalScore = 0;
    let allTermsMatch = true;

    for (const term of terms) {
      let termScore = 0;

      // Check fields in priority order, accumulate best matches
      if (name === term) {
        termScore += 100;
      } else if (name.startsWith(term)) {
        termScore += 50;
      } else if (name.includes(term)) {
        termScore += 20;
      }

      if (desc.includes(term)) {
        termScore += 10;
      }

      if (item.categories.some((c) => c.toLowerCase().includes(term))) {
        termScore += 10;
      }

      if (regName.includes(term)) {
        termScore += 5;
      }

      if (termScore === 0) {
        allTermsMatch = false;
        break; // AND logic: all terms must match something
      }

      totalScore += termScore;
    }

    if (allTermsMatch) {
      scored.push({
        item,
        score: totalScore,
        registryKey: `${item.registry.owner}/${item.registry.repo}`,
      });
    }
  }

  if (scored.length === 0) return [];

  // 2. Group by registry, sort each group by score desc
  const groups = new Map<string, ScoredItem[]>();

  for (const s of scored) {
    let group = groups.get(s.registryKey);
    if (!group) {
      group = [];
      groups.set(s.registryKey, group);
    }
    group.push(s);
  }

  // Sort each group by score descending
  for (const group of groups.values()) {
    group.sort((a, b) => b.score - a.score);
  }

  // Order registries by their top item score (best-match registry first)
  const sortedGroups = Array.from(groups.values()).sort(
    (a, b) => (b[0]?.score ?? 0) - (a[0]?.score ?? 0)
  );

  // 3. Round-robin interleave
  const result: IndexedItem[] = [];
  let round = 0;
  let added = true;

  while (added) {
    added = false;
    for (const group of sortedGroups) {
      const entry = group[round];
      if (entry) {
        result.push(entry.item);
        added = true;
      }
    }
    round++;
  }

  return result;
}
