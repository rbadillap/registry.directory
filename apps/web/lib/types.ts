export type DirectoryEntry = {
  name: string;
  description: string;
  url: string;
  github_url?: string;
  github_profile?: string;
  registry_url?: string;
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