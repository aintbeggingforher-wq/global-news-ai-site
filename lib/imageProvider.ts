import { uploadGeneratedImage, uploadPngToStorage } from "./storage";

export type ImageProviderResult = {
  imageUrl: string | null;
  providerUrl?: string | null;
  error: string | null;
};

const PROVIDER = process.env.IMAGE_PROVIDER || "higgsfield";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";

const HF_KEY = process.env.HF_KEY;
const HF_API_KEY = process.env.HF_API_KEY;
const HF_API_SECRET = process.env.HF_API_SECRET;
const HIGGSFIELD_MODEL = process.env.HIGGSFIELD_MODEL || "flux-pro/kontext/max/text-to-image";
const HIGGSFIELD_BASE_URL = process.env.HIGGSFIELD_BASE_URL || "https://platform.higgsfield.ai";
const HIGGSFIELD_POLL_LIMIT_MS = Number(process.env.HIGGSFIELD_POLL_LIMIT_MS || 55000);

export function getImageProviderStatus() {
  return {
    provider: PROVIDER,
    hasHiggsfieldSingleKey: Boolean(HF_KEY),
    hasHiggsfieldKeyAndSecret: Boolean(HF_API_KEY && HF_API_SECRET),
    higgsfieldModel: HIGGSFIELD_MODEL,
    higgsfieldBaseUrl: HIGGSFIELD_BASE_URL,
    hasOpenAIKey: Boolean(OPENAI_API_KEY),
    openaiModel: OPENAI_IMAGE_MODEL,
    bucket: process.env.SUPABASE_STORAGE_BUCKET || "news-images",
  };
}

function getHiggsfieldCredential() {
  if (HF_KEY) return HF_KEY;
  if (HF_API_KEY && HF_API_SECRET) return `${HF_API_KEY}:${HF_API_SECRET}`;
  return null;
}

function higgsfieldHeaders(): Record<string, string> {
  const credential = getHiggsfieldCredential();
  if (!credential) return {};
  return {
    Authorization: `Key ${credential}`,
    "Content-Type": "application/json",
    "User-Agent": "the-american-desk-vercel/1.0",
  };
}

function absoluteHiggsfieldUrl(url: string) {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${HIGGSFIELD_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

async function downloadAsBase64(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not download generated image: ${await res.text()}`);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer).toString("base64");
}

function extractImageUrl(data: any): string | null {
  return (
    data?.images?.[0]?.url ||
    data?.image?.url ||
    data?.image_url ||
    data?.url ||
    data?.result?.images?.[0]?.url ||
    data?.result?.image_url ||
    data?.output?.images?.[0]?.url ||
    data?.output?.image_url ||
    data?.jobs?.[0]?.results?.raw?.url ||
    data?.jobs?.[0]?.results?.min?.url ||
    null
  );
}

function extractError(data: any): string | null {
  return data?.detail || data?.details || data?.message || data?.error || data?.reason || null;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pollHiggsfieldResult(statusUrl: string) {
  const started = Date.now();
  let lastJson: any = null;

  while (Date.now() - started < HIGGSFIELD_POLL_LIMIT_MS) {
    const statusRes = await fetch(absoluteHiggsfieldUrl(statusUrl), {
      method: "GET",
      headers: higgsfieldHeaders(),
      cache: "no-store",
    });

    const text = await statusRes.text();
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = { raw: text };
    }

    lastJson = json;

    if (!statusRes.ok) {
      throw new Error(`Higgsfield status error ${statusRes.status}: ${text}`);
    }

    const imageUrl = extractImageUrl(json);
    if (imageUrl) return { json, imageUrl };

    const status = String(json?.status || "").toLowerCase();
    if (["failed", "nsfw", "canceled", "cancelled"].includes(status)) {
      throw new Error(`Higgsfield generation ${status}: ${extractError(json) || JSON.stringify(json).slice(0, 500)}`);
    }

    await sleep(2000);
  }

  throw new Error(`Higgsfield polling timed out. Last response: ${JSON.stringify(lastJson).slice(0, 700)}`);
}

async function generateWithHiggsfield(opts: { postId: string; prompt: string; path?: string }): Promise<ImageProviderResult> {
  if (!getHiggsfieldCredential()) {
    return { imageUrl: null, error: "Missing Higgsfield credentials. Add HF_KEY or HF_API_KEY + HF_API_SECRET in Vercel." };
  }

  try {
    const endpoint = absoluteHiggsfieldUrl(HIGGSFIELD_MODEL);

    const res = await fetch(endpoint, {
      method: "POST",
      headers: higgsfieldHeaders(),
      body: JSON.stringify({
  prompt: opts.prompt,
  aspect_ratio: process.env.HIGGSFIELD_ASPECT_RATIO || "16:9",
  safety_tolerance: Number(process.env.HIGGSFIELD_SAFETY_TOLERANCE || 2),
  seed: Math.floor(Math.random() * 1000000),
}),

    const responseText = await res.text();
    let data: any = null;
    try {
      data = responseText ? JSON.parse(responseText) : null;
    } catch {
      data = { raw: responseText };
    }

    if (!res.ok) {
      return { imageUrl: null, error: `Higgsfield submit error ${res.status}: ${responseText}` };
    }

    let generatedUrl = extractImageUrl(data);

    if (!generatedUrl) {
      const statusUrl = data?.status_url || data?.response_url || (data?.request_id ? `/requests/${data.request_id}/status` : null);
      if (!statusUrl) {
        return { imageUrl: null, error: `Higgsfield response missing image/status URL: ${JSON.stringify(data).slice(0, 800)}` };
      }
      const polled = await pollHiggsfieldResult(statusUrl);
      generatedUrl = polled.imageUrl;
    }

    const b64 = await downloadAsBase64(generatedUrl);
    const publicUrl = opts.path
      ? await uploadPngToStorage({ path: opts.path, base64Png: b64 })
      : await uploadGeneratedImage({ postId: opts.postId, base64Png: b64 });

    return {
      imageUrl: publicUrl,
      providerUrl: generatedUrl,
      error: publicUrl ? null : "Supabase upload failed after Higgsfield generation.",
    };
  } catch (error: any) {
    return { imageUrl: null, error: error?.message || "Unknown Higgsfield image error." };
  }
}

async function generateWithOpenAI(opts: { postId: string; prompt: string; path?: string }): Promise<ImageProviderResult> {
  if (!OPENAI_API_KEY) return { imageUrl: null, error: "Missing OPENAI_API_KEY." };

  try {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: OPENAI_IMAGE_MODEL, prompt: opts.prompt, size: "1024x1024" }),
    });

    if (!res.ok) return { imageUrl: null, error: `OpenAI image error: ${await res.text()}` };

    const data = await res.json();
    const b64 = data.data?.[0]?.b64_json;
    if (!b64) return { imageUrl: null, error: "OpenAI did not return b64_json." };

    const publicUrl = opts.path
      ? await uploadPngToStorage({ path: opts.path, base64Png: b64 })
      : await uploadGeneratedImage({ postId: opts.postId, base64Png: b64 });

    return { imageUrl: publicUrl, error: publicUrl ? null : "Supabase upload failed." };
  } catch (error: any) {
    return { imageUrl: null, error: error?.message || "Unknown OpenAI image error." };
  }
}

export async function generateEditorialImage(opts: { postId: string; prompt: string; path?: string }): Promise<ImageProviderResult> {
  if (process.env.GENERATE_IMAGES !== "true") return { imageUrl: null, error: "GENERATE_IMAGES is not set to true." };

  if (PROVIDER === "openai") return generateWithOpenAI(opts);

  const hf = await generateWithHiggsfield(opts);
  if (hf.error && process.env.IMAGE_FALLBACK_PROVIDER === "openai") {
    const openai = await generateWithOpenAI(opts);
    return { ...openai, error: openai.error ? `${hf.error} | fallback failed: ${openai.error}` : null };
  }

  return hf;
}
