export type DirectoryEntry = {
  name: string;
  description: string;
  url: string;
  logo?: string;
  featured?: boolean;
  longDescription?: string;
  category?: string;
  tags?: string[];
  preview?: string;
  stats?: {
    components?: number;
    downloads?: number;
    stars?: number;
  };
};