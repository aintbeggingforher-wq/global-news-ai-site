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
    prompt: "Create a highly realistic AI-generated editorial illustration for a premium U.S. news homepage: a newsroom-style composition with papers, screens, a subtle American-city backdrop, soft natural light, photoreal treatment, clearly illustrative and not a real photo, no logos, no text overlays."
  });

  return NextResponse.json({ ok: !result.error, image_config: getImageConfigStatus(), image_url: result.imageUrl, error: result.error });
}
