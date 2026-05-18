const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "news-images";

function assertSupabase() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }
}

export function getPublicStorageUrl(path: string) {
  if (!SUPABASE_URL) return null;
  return `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_STORAGE_BUCKET}/${path}`;
}

export async function uploadPngToStorage(opts: { path: string; base64Png: string; }) {
  assertSupabase();
  const bytes = Buffer.from(opts.base64Png, "base64");

  const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/${SUPABASE_STORAGE_BUCKET}/${opts.path}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "image/png",
      "x-upsert": "true"
    },
    body: bytes
  });

  if (!uploadRes.ok) {
    console.error("Supabase storage upload error", await uploadRes.text());
    return null;
  }

  return getPublicStorageUrl(opts.path);
}

export async function uploadGeneratedImage(opts: { postId: string; base64Png: string; }) {
  return uploadPngToStorage({ path: `daily/${opts.postId}.png`, base64Png: opts.base64Png });
}
