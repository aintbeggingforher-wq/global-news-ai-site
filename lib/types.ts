export type RawArticle = {
  title: string;
  description?: string | null;
  url: string;
  sourceName?: string | null;
  publishedAt?: string | null;
  region?: string | null;
};

export type NewsPost = {
  id: string;
  slug: string;
  title: string;
  dek: string;
  summary: string;
  body: string;
  category: string;
  subcategory: string;
  region: string;
  author_name: string;
  author_title: string;
  reading_time: number;
  source_name: string;
  source_url: string;
  image_prompt: string;
  image_url?: string | null;
  image_alt?: string | null;
  published_at: string;
  created_at?: string;
};

export type SectionConfig = {
  slug: string;
  label: string;
  description: string;
  subcategories: string[];
  keywords: string[];
};
