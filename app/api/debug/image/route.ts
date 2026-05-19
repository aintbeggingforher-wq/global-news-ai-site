import { NextRequest, NextResponse } from "next/server";
import { generateAndUploadImage, getImageConfigStatus } from "@/lib/image";

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
  const result = await generateAndUploadImage({
    postId: `debug-${Date.now()}`,
    prompt: "Highly realistic editorial photo illustration for a premium U.S. digital news site: a serious newsroom desk, papers, laptop, subtle American city skyline through a window, natural morning light, photorealistic camera perspective, no logos, no readable text, original editorial visual."
  });
  return NextResponse.json({ ok: !result.error, image_config: getImageConfigStatus(), image_url: result.imageUrl, error: result.error });
}
