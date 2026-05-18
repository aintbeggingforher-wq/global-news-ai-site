import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isAuthorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const key = process.env.NEWS_API_KEY;
  if (!key) {
    return NextResponse.json({ ok: false, hasNewsApiKey: false, error: "Missing NEWS_API_KEY in Vercel." });
  }

  const url = new URL("https://newsapi.org/v2/top-headlines");
  url.searchParams.set("country", "us");
  url.searchParams.set("language", "en");
  url.searchParams.set("pageSize", "5");
  url.searchParams.set("apiKey", key);

  const res = await fetch(url.toString(), { cache: "no-store" });
  const text = await res.text();

  let data: any = null;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  return NextResponse.json({
    ok: res.ok,
    hasNewsApiKey: true,
    status: res.status,
    totalResults: data?.totalResults,
    articleCount: data?.articles?.length || 0,
    error: data?.message || data?.code || null,
    sampleTitles: (data?.articles || []).map((a: any) => a.title).slice(0, 5),
  });
}
