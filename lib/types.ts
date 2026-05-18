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
  title: string;
  summary: string;
  region: string;
  source_name: string;
  source_url: string;
  image_prompt: string;
  image_url?: string | null;
  published_at: string;
  created_at?: string;
};
