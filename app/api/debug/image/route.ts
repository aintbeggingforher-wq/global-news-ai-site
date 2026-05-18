import { NextRequest, NextResponse } from "next/server";
import { generateAndUploadImage, getImageConfigStatus } from "@/lib/image";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isAuthorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const result = await generateAndUploadImage({
    postId: `debug-${Date.now()}`,
    prompt: "Create a highly realistic AI-generated editorial image for a premium U.S. digital news homepage: a newsroom desk, laptops, notes, a blurred American city through a window, natural daylight, photojournalism style, realistic depth of field, no logos, no text overlays, not a real event photo."
  });
  return NextResponse.json({ ok: !result.error, image_config: getImageConfigStatus(), image_url: result.imageUrl, error: result.error });
}
