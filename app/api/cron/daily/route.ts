import { NextRequest, NextResponse } from "next/server";
import { buildDailyPosts } from "@/lib/news";
import { insertPosts } from "@/lib/db";

export const dynamic = "force-dynamic";

function isAuthorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const auth = req.headers.get("authorization");
  const vercelCron = req.headers.get("x-vercel-cron");

  return auth === `Bearer ${secret}` || vercelCron === "1";
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const posts = await buildDailyPosts();
  await insertPosts(posts);

  return NextResponse.json({
    ok: true,
    created: posts.length,
    posts: posts.map((p) => ({ id: p.id, title: p.title, source: p.source_url })),
  });
}
