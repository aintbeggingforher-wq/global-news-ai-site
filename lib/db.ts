import type { NewsPost } from "./types";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function assertSupabase() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }
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

  if (!res.ok) {
    throw new Error(`Supabase error on ${path}: ${await res.text()}`);
  }

  return res;
}

export async function getPosts(limit = 40): Promise<NewsPost[]> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return [];
  const res = await restFetch(`posts?select=*&order=published_at.desc&limit=${limit}`);
  return res.json();
}

export async function getPostsByCategory(category: string, limit = 24): Promise<NewsPost[]> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return [];
  const res = await restFetch(`posts?select=*&category=eq.${encodeURIComponent(category)}&order=published_at.desc&limit=${limit}`);
  return res.json();
}

export async function getPostBySlug(slug: string): Promise<NewsPost | null> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  const res = await restFetch(`posts?select=*&slug=eq.${encodeURIComponent(slug)}&limit=1`);
  const rows = await res.json();
  return rows[0] || null;
}

export async function insertPosts(posts: NewsPost[]) {
  if (posts.length === 0) return;
  await restFetch("posts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates"
    },
    body: JSON.stringify(posts)
  });
}
