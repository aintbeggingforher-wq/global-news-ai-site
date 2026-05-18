import { NextRequest, NextResponse } from "next/server";
import { insertPosts } from "@/lib/db";
import { generateAndUploadImage } from "@/lib/image";
import type { NewsPost } from "@/lib/types";
import { getAuthorForCategory, getPublicAuthorAvatarUrl } from "@/lib/authors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isAuthorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const author = getAuthorForCategory("national");
  const imagePrompt = "Create a highly realistic AI-generated editorial image of firefighters responding to a large warehouse fire at night in Texas. Flames and thick smoke rise from an industrial building, emergency lights reflect on wet pavement, firefighters stand at a safe operational distance in turnout gear, realistic urban-industrial surroundings, premium American news photojournalism style, dramatic but believable, no logos, no text overlays, no identifiable private people, not an actual event photograph.";
  const image = await generateAndUploadImage({ postId: "manual-texas-warehouse-fire-001", prompt: imagePrompt });

  const post: NewsPost = {
    id: "manual-texas-warehouse-fire-001",
    slug: "texas-warehouse-fire-investigated-as-suspected-arson",
    title: "Texas Warehouse Fire Investigated as Suspected Arson",
    dek: "Authorities say a major Texas warehouse blaze is being treated as a possible criminal fire while investigators work through the scene.",
    summary: "A large Texas warehouse fire is under investigation as suspected arson after early indicators raised concerns that the blaze may have been intentionally set. Fire crews worked for hours to contain flames and heavy smoke while officials secured the surrounding area.",
    body: "A large warehouse fire in Texas is being investigated as a possible act of arson after authorities said early indicators at the scene raised concerns about a criminal cause. Officials have not announced a final determination, and investigators are continuing to review available evidence.\n\nFire crews spent hours battling flames and heavy smoke while emergency teams worked to secure the surrounding area. Officials said the first priority was to keep the fire from spreading, protect nearby properties and make the site safe enough for investigators to begin their work.\n\nInvestigators are expected to examine burn patterns, entry points, surveillance footage if available and witness accounts. Those details can help officials determine whether the fire started accidentally or was deliberately set.\n\nThe full extent of the damage has not been confirmed in the limited information available for this report. The case remains under investigation, and the source link should be replaced with a verified local report or official statement before this is treated as a fully sourced live article.",
    category: "national",
    subcategory: "Public Safety",
    region: "USA",
    author_name: "Daniel Reyes",
    author_title: "National Affairs Reporter",
    author_avatar_url: getPublicAuthorAvatarUrl(author),
    author_photo_note: "AI-generated fictional newsroom portrait.",
    reading_time: 3,
    source_name: "Local authorities / local news",
    source_url: "https://global-news-ai-site.vercel.app",
    image_prompt: imagePrompt,
    image_url: image.imageUrl,
    image_alt: "AI-generated editorial illustration of firefighters responding to a warehouse fire in Texas.",
    video_url: null,
    video_embed_url: null,
    video_source_name: null,
    video_title: null,
    is_featured: true,
    published_at: new Date().toISOString()
  };

  await insertPosts([post]);
  return NextResponse.json({ ok: true, post, image_error: image.error });
}
