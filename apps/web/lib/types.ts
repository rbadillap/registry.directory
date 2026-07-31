export type ProOfferings = {
  pro_blocks: boolean;
  templates: boolean;
  figma_kit: boolean;
  mcp_agent: boolean;
  team_license: boolean;
};

// Fixed row order for the PRO card — the offer taxonomy is comparable
// across registries only if every landing lists the same five, in the same order.
export const PRO_OFFERING_LABELS: ReadonlyArray<
  [keyof ProOfferings, string]
> = [
  ["pro_blocks", "Pro blocks & components"],
  ["templates", "Templates"],
  ["figma_kit", "Figma kit"],
  ["mcp_agent", "MCP / agent skills"],
  ["team_license", "Team license"],
];

export type DirectoryEntry = {
  name: string;
  description: string;
  url: string;
  github_url?: string;
  github_profile?: string;
  registry_url?: string;
  namespace?: string; // official shadcn registry handle, e.g. "@aceternity"
  featured?: string[]; // 1–6 item names, curated; empty/absent hides the section
  pro?: ProOfferings; // absent hides the PRO card; present requires all five
};

export type CategoryStat = {
  slug: string;
  count: number;
};

export type RegistryStats = {
  totalItems: number;
  categories: CategoryStat[];
  topItems: string[];
};

export type GitHubStats = {
  stars: number;
  lastCommit: string; // ISO date
  fetchedAt: string; // ISO date — for cache expiry
};

export type AffiliateConfig = {
  url: string;           // Matches DirectoryEntry.url — the join key
  affiliate_url: string; // URL with tracking params
  label: string;         // Display name
  program: string;       // Program identifier for bulk operations
  logo_url?: string;     // Avatar for entries without github_profile
};