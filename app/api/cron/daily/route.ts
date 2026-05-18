import { NextRequest, NextResponse } from "next/server";
import { buildDailyPosts } from "@/lib/news";
import { insertPosts } from "@/lib/db";
import { getImageConfigStatus } from "@/lib/image";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isAuthorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  const vercelCron = req.headers.get("x-vercel-cron");
  return auth === `Bearer ${secret}` || vercelCron === "1";
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const result = await buildDailyPosts();
  await insertPosts(result.posts);
  return NextResponse.json({
    ok: true,
    created: result.posts.length,
    images_created: result.posts.filter((p) => Boolean(p.image_url)).length,
    videos_attached: result.posts.filter((p) => Boolean(p.video_embed_url)).length,
    image_config: getImageConfigStatus(),
    image_errors: result.imageErrors,
    posts: result.posts.map((p) => ({ id: p.id, slug: p.slug, title: p.title, category: p.category, author: p.author_name, image_url: p.image_url, video_embed_url: p.video_embed_url }))
  });
}
