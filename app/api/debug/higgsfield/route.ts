import { NextRequest, NextResponse } from "next/server";
import { generateEditorialImage, getImageProviderStatus } from "@/lib/imageProvider";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isAuthorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await generateEditorialImage({
    postId: `debug-higgsfield-${Date.now()}`,
    prompt: "Ultra-realistic premium American newsroom photo illustration: a city street near a government building at golden hour, journalists and cameras in the distance, natural light, editorial style, no logos, no text overlays, no identifiable private people.",
  });

  return NextResponse.json({ ok: !result.error, image_config: getImageProviderStatus(), image_url: result.imageUrl, provider_url: result.providerUrl, error: result.error });
}
