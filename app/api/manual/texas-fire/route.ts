import { NextRequest, NextResponse } from "next/server";
import { generateAndUploadImage } from "@/lib/image";

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
    throw new Error("Missing Supabase environment variables.");
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

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res;
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 90);
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const postId = "manual-texas-warehouse-fire-001";

  const title = "Texas Warehouse Fire Investigated as Suspected Arson";

  const imagePrompt = [
    "Ultra-realistic premium American digital newspaper photo illustration.",
    "A nighttime Texas industrial warehouse fire scene.",
    "Flames and smoke must come only from the warehouse structure, roofline, windows, and loading bay area.",
    "Firefighters must be positioned at a safe operational distance behind police tape or near emergency vehicles.",
    "Wet pavement reflecting red and blue emergency lights.",
    "Realistic smoke, realistic scale, realistic fire behavior, realistic industrial surroundings.",
    "No person inside flames.",
    "No person touching fire.",
    "No one standing in impossible or fatal positions.",
    "No fire coming from the ground like lava.",
    "No giant explosion, no fireball, no disaster movie look.",
    "No visible injuries, no gore, no readable text, no logos, no watermark.",
    "Documentary-style U.S. newspaper photojournalism composition.",
  ].join(" ");

  const image = await generateAndUploadImage({
    postId,
    prompt: imagePrompt,
  });

  const post = {
    id: postId,
    slug: slugify(title),

    title,
    dek: "Authorities are examining whether a major warehouse fire in Texas may have been intentionally set.",
    summary:
      "A large warehouse fire in Texas is under investigation as suspected arson after early indicators raised concerns that the blaze may have been intentionally set.",

    body:
      "A major fire tore through a warehouse facility in Texas, sending thick smoke above the industrial site and drawing a large emergency response from firefighters, police and investigators.\n\nAuthorities said the fire caused significant structural damage and forced crews to secure the surrounding area while they worked to contain the blaze. Investigators are examining whether the fire may have been intentionally set. Officials have not announced a final determination, but early indicators at the scene prompted an arson-focused review.\n\nFire crews remained on site to monitor hot spots and prevent the fire from spreading to nearby properties. Authorities said the review will include burn patterns, possible entry points, surveillance footage if available and witness statements.\n\nLocal officials urged residents to avoid the area while emergency crews continued recovery work. Investigators are expected to release additional details once the origin and cause of the fire are confirmed.",

    category: "national",
    subcategory: "Public Safety",
    region: "USA",

    author_name: "Daniel Reyes",
    author_title: "National Affairs Reporter",
    author_avatar_url: null,

    source_name: "Editorial desk",
    source_url: "https://global-news-ai-site.vercel.app",

    image_prompt: imagePrompt,
    image_url: image.imageUrl || null,
    image_alt:
      "Firefighters respond from a safe distance to a warehouse fire at an industrial site in Texas.",

    video_url: null,
    video_embed_url: null,
    video_source_name: null,
    video_title: null,

    reading_time: 3,
    is_featured: true,
    published_at: new Date().toISOString(),
  };

  await supabaseFetch("posts?on_conflict=id", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(post),
  });

  return NextResponse.json({
    ok: true,
    post_id: postId,
    title,
    image_url: image.imageUrl,
    image_error: image.error,
  });
}
