import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { AffiliateConfig } from "./types";

/**
 * Read affiliate configs from affiliates.json at build time.
 * Returns a Record keyed by `url` for O(1) lookup against DirectoryEntry.url.
 * Returns empty record if the kill switch is off or the file is missing.
 */
export async function getAffiliates(): Promise<Record<string, AffiliateConfig>> {
  if (process.env.NEXT_PUBLIC_AFFILIATES_ENABLED === "false") {
    return {};
  }

  try {
    const filePath = join(process.cwd(), "public/affiliates.json");
    const fileContents = await readFile(filePath, "utf8");
    const data = JSON.parse(fileContents) as { affiliates: AffiliateConfig[] };

    const record: Record<string, AffiliateConfig> = {};
    for (const affiliate of data.affiliates) {
      record[affiliate.url] = affiliate;
    }
    return record;
  } catch {
    return {};
  }
}
