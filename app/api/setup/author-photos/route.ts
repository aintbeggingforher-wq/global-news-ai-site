import { NextRequest, NextResponse } from "next/server";
import { getPhotoEligibleAuthors } from "@/lib/authors";
import { generateAndUploadImage } from "@/lib/image";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isAuthorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const results = [];
  for (const author of getPhotoEligibleAuthors()) {
    const result = await generateAndUploadImage({
      postId: author.avatarPath || author.name,
      path: author.avatarPath,
      prompt: author.portraitPrompt || `Professional newsroom profile headshot for ${author.name}, realistic staff-directory style, no logos, no text.`
    });
    results.push({ author: author.name, url: result.imageUrl, error: result.error });
  }

  return NextResponse.json({ ok: results.every((item) => !item.error), results });
}
