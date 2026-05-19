import { NextRequest, NextResponse } from "next/server";
import { generateAndUploadImage, getImageConfigStatus } from "@/lib/image";
import { buildEditorialImagePrompt } from "@/lib/editorialPrompts";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function isAuthorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

async function supabaseFetch(path: string, init?: RequestInit) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing Supabase env vars.");
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  if (!res.ok) throw new Error(await res.text());
  return res;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = Number(req.nextUrl.searchParams.get("limit") || 2);

  const rowsRes = await supabaseFetch(
    `posts?select=id,title,summary,category,subcategory,region,image_prompt,image_url&or=(image_url.is.null,image_url.eq.)&order=published_at.desc&limit=${limit}`
  );

  const rows = await rowsRes.json();
  const results = [];

  for (const post of rows) {
    const prompt = buildEditorialImagePrompt({
      title: post.title,
      summary: post.summary,
      category: post.category,
      subcategory: post.subcategory,
      region: post.region,
    });

    const image = await generateAndUploadImage({ postId: post.id, prompt });

    if (image.imageUrl) {
      await supabaseFetch(`posts?id=eq.${encodeURIComponent(post.id)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ image_url: image.imageUrl, image_prompt: prompt, image_alt: `Editorial photo illustration for ${post.title}` }),
      });
    }

    results.push({
      id: post.id,
      title: post.title,
      image_url: image.imageUrl,
      error: image.error,
    });
  }

  return NextResponse.json({
    ok: true,
    image_config: getImageConfigStatus(),
    processed: results.length,
    results,
  });
}
