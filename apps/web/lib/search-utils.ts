import type { IndexedItem } from "./items-index";

interface ScoredItem<T> {
  item: T;
  score: number;
  registryKey: string;
}

/**
 * An item with the text it is searched by already normalised.
 *
 * The catalogue does not change between one keystroke and the next, but the
 * same names and descriptions were being lowercased and stripped of their
 * separators on every one of them — tens of thousands of times per letter,
 * to compare against a query that takes microseconds. Doing it once, when
 * the index arrives, is the whole difference.
 */
interface PreparedItem<T> {
  item: T;
  name: string;
  description: string;
  registryName: string;
  categories: string[];
  registryKey: string;
}

export type PreparedIndex<T extends IndexedItem = IndexedItem> = ReadonlyArray<
  PreparedItem<T>
>;

/** Normalise the text of every item once, for reuse across searches. */
export function prepareSearchIndex<T extends IndexedItem>(
  items: readonly T[]
): PreparedIndex<T> {
  return items.map((item) => ({
    item,
    name: normalizeForSearch(item.name),
    description: normalizeForSearch(item.description),
    registryName: normalizeForSearch(item.registry.name),
    categories: item.categories.map(normalizeForSearch),
    registryKey: item.registry.basePath,
  }));
}

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

/**
 * Search items with multi-term AND matching, relevance scoring, and
 * round-robin interleaving across registries.
 *
 * - "button" → items named "button" from all registries first, then partials
 * - "button tailark" → Tailark items matching "button"
 * - Exact name matches score highest, registry name matches lowest
 */
export function searchItems<T extends IndexedItem>(
  items: readonly T[],
  query: string
): T[] {
  return searchPrepared(prepareSearchIndex(items), query);
}

/**
 * The same search, over an index whose text was normalised in advance.
 * Callers that search the same collection more than once should prepare it
 * with prepareSearchIndex and use this.
 */
export function searchPrepared<T extends IndexedItem>(
  prepared: PreparedIndex<T>,
  query: string
): T[] {
  const terms = searchTerms(query);
  if (terms.length === 0) return [];

  // Kept whole as well as split: someone who types a component's full name
  // should outrank someone whose words merely appear in it.
  const whole = normalizeForSearch(query);

  // 1. Score + filter in one pass
  const scored: ScoredItem<T>[] = [];

  for (const entry of prepared) {
    // Already normalised on both sides, so a name published as alert-dialog
    // answers to the words someone actually types.
    const { name, description: desc, registryName: regName } = entry;

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

      if (entry.categories.some((c) => c.includes(term))) {
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
        item: entry.item,
        score: totalScore,
        registryKey: entry.registryKey,
      });
    }
  }

  if (scored.length === 0) return [];

  // 2. Group by registry, sort each group by score desc
  const groups = new Map<string, ScoredItem<T>[]>();

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
  const result: T[] = [];
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
