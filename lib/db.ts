import type { NewsPost } from "./types";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function assertSupabase() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
}

async function restFetch(path: string, init?: RequestInit) {
  assertSupabase();
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      ...(init?.headers || {})
    },
    cache: "no-store"
  });
  if (!res.ok) throw new Error(`Supabase error on ${path}: ${await res.text()}`);
  return res;
}

function normalizePost(row: any): NewsPost {
  const title = row.title || "Untitled";
  const summary = row.summary || row.dek || "Details are limited.";
  const body = row.body || summary;
  return {
    id: row.id,
    slug: row.slug || row.id,
    title,
    dek: row.dek || summary,
    summary,
    body,
    category: row.category || "national",
    subcategory: row.subcategory || "General",
    region: row.region || "USA",
    author_name: row.author_name || "The American Desk Staff",
    author_title: row.author_title || "News Desk",
    reading_time: row.reading_time || Math.max(2, Math.ceil(body.split(/\s+/).length / 220)),
    source_name: row.source_name || "Source",
    source_url: row.source_url,
    image_prompt: row.image_prompt || "",
    image_url: row.image_url || null,
    image_alt: row.image_alt || `AI-generated editorial illustration for: ${title}`,
    published_at: row.published_at || row.created_at || new Date().toISOString(),
    created_at: row.created_at
  };
}

export async function getPosts(limit = 30): Promise<NewsPost[]> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return [];
  const res = await restFetch(`posts?select=*&order=published_at.desc&limit=${limit}`);
  const rows = await res.json();
  return rows.map(normalizePost);
}

export async function getDisplayPosts(limit = 30): Promise<NewsPost[]> {
  const posts = await getPosts(limit);
  const withImages = posts.filter((post) => Boolean(post.image_url));
  return withImages.length > 0 ? withImages : posts;
}

export async function getPostsByCategory(category: string, limit = 24): Promise<NewsPost[]> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return [];
  const res = await restFetch(`posts?select=*&category=eq.${encodeURIComponent(category)}&order=published_at.desc&limit=${limit}`);
  const rows = await res.json();
  return rows.map(normalizePost);
}

export async function getPostBySlug(slug: string): Promise<NewsPost | null> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  const res = await restFetch(`posts?select=*&slug=eq.${encodeURIComponent(slug)}&limit=1`);
  const rows = await res.json();
  return rows[0] ? normalizePost(rows[0]) : null;
}

export async function insertPosts(posts: NewsPost[]) {
  if (posts.length === 0) return;
  await restFetch("posts", {
    method: "POST",
    headers: { "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify(posts)
  });
}
