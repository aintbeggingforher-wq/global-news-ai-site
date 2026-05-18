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
const HIGGSFIELD_MODEL = process.env.HIGGSFIELD_MODEL || "bytedance/seedream/v4/text-to-image";
const HIGGSFIELD_SUBSCRIBE_URL = process.env.HIGGSFIELD_SUBSCRIBE_URL || "https://cloud.higgsfield.ai/api/v1/subscribe";

export function getImageProviderStatus() {
  return {
    provider: PROVIDER,
    hasHiggsfieldSingleKey: Boolean(HF_KEY),
    hasHiggsfieldKeyAndSecret: Boolean(HF_API_KEY && HF_API_SECRET),
    higgsfieldModel: HIGGSFIELD_MODEL,
    higgsfieldUrl: HIGGSFIELD_SUBSCRIBE_URL,
    hasOpenAIKey: Boolean(OPENAI_API_KEY),
    openaiModel: OPENAI_IMAGE_MODEL,
    bucket: process.env.SUPABASE_STORAGE_BUCKET || "news-images",
  };
}

function authHeaders() {
  if (HF_KEY) return { Authorization: `Bearer ${HF_KEY}` };
  if (HF_API_KEY && HF_API_SECRET) {
    return {
      "X-HF-API-Key": HF_API_KEY,
      "X-HF-API-Secret": HF_API_SECRET,
      Authorization: `Bearer ${HF_API_KEY}:${HF_API_SECRET}`,
    };
  }
  return {};
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
    null
  );
}

async function generateWithHiggsfield(opts: { postId: string; prompt: string; path?: string }): Promise<ImageProviderResult> {
  if (!HF_KEY && !(HF_API_KEY && HF_API_SECRET)) {
    return { imageUrl: null, error: "Missing Higgsfield credentials. Add HF_KEY or HF_API_KEY + HF_API_SECRET in Vercel." };
  }
  try {
    const res = await fetch(HIGGSFIELD_SUBSCRIBE_URL, {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({
        model: HIGGSFIELD_MODEL,
        arguments: {
          prompt: opts.prompt,
          resolution: process.env.HIGGSFIELD_RESOLUTION || "2K",
          aspect_ratio: process.env.HIGGSFIELD_ASPECT_RATIO || "16:9",
          camera_fixed: false,
        },
      }),
    });
    if (!res.ok) return { imageUrl: null, error: `Higgsfield error: ${await res.text()}` };
    const data = await res.json();
    const generatedUrl = extractImageUrl(data);
    if (!generatedUrl) return { imageUrl: null, error: `Higgsfield response did not include an image URL. Response: ${JSON.stringify(data).slice(0, 800)}` };
    const b64 = await downloadAsBase64(generatedUrl);
    const publicUrl = opts.path
      ? await uploadPngToStorage({ path: opts.path, base64Png: b64 })
      : await uploadGeneratedImage({ postId: opts.postId, base64Png: b64 });
    return { imageUrl: publicUrl, providerUrl: generatedUrl, error: publicUrl ? null : "Supabase upload failed after Higgsfield generation." };
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
