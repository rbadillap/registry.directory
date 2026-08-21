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
/**
 * Lowercased, with the separators component names use — hyphens, underscores,
 * slashes — read as spaces.
 *
 * A person types "alert dialog"; the registry published "alert-dialog". Those
 * are the same words, and the only thing between them is punctuation nobody
 * says out loud. Applying this to the query and to the text being searched
 * means either spelling finds the other.
 */
export function normalizeForSearch(text: string): string {
  return text.toLowerCase().replace(/[-_/]+/g, " ").replace(/\s+/g, " ").trim()
}

/** The words of a query, separators included as breaks. */
export function searchTerms(query: string): string[] {
  return normalizeForSearch(query).split(" ").filter(Boolean)
}

export function searchItems(
  items: IndexedItem[],
  query: string
): IndexedItem[] {
  const terms = searchTerms(query);
  if (terms.length === 0) return [];

  // Kept whole as well as split: someone who types a component's full name
  // should outrank someone whose words merely appear in it.
  const whole = normalizeForSearch(query);

  // 1. Score + filter in one pass
  const scored: ScoredItem[] = [];

  for (const item of items) {
    // Normalized on both sides, so a name published as alert-dialog answers
    // to the words someone actually types.
    const name = normalizeForSearch(item.name);
    const desc = normalizeForSearch(item.description);
    const regName = normalizeForSearch(item.registry.name);

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

      if (item.categories.some((c) => normalizeForSearch(c).includes(term))) {
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

    // A single-word query already scored its exact match inside the loop.
    // This restores the one that splitting took away: "alert-dialog" becomes
    // two words, so nothing equals the name any more, and a person who spelled
    // it out should still outrank one whose words merely appear in it.
    if (allTermsMatch && terms.length > 1 && name === whole) {
      totalScore += 100;
    }

    if (allTermsMatch) {
      scored.push({
        item,
        score: totalScore,
        registryKey: item.registry.basePath,
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
