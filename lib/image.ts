import { uploadPngToStorage } from "./storage";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";
const GENERATE_IMAGES = process.env.GENERATE_IMAGES === "true";

export function getImageConfigStatus() {
  return {
    generateImages: GENERATE_IMAGES,
    hasOpenAIKey: Boolean(OPENAI_API_KEY),
    imageModel: OPENAI_IMAGE_MODEL,
    bucket: process.env.SUPABASE_STORAGE_BUCKET || "news-images",
    hasSupabaseUrl: Boolean(process.env.SUPABASE_URL),
    hasSupabaseServiceKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
  };
}

async function generateBase64(prompt: string) {
  if (!GENERATE_IMAGES) return { b64: null, error: "GENERATE_IMAGES is not set to true." };
  if (!OPENAI_API_KEY) return { b64: null, error: "Missing OPENAI_API_KEY." };

  try {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: OPENAI_IMAGE_MODEL,
        prompt,
        size: "1024x1024"
      })
    });

    if (!res.ok) return { b64: null, error: `OpenAI image error: ${await res.text()}` };
    const data = await res.json();
    const b64 = data.data?.[0]?.b64_json || null;
    if (!b64) return { b64: null, error: "No b64_json returned by the image API." };
    return { b64, error: null };
  } catch (error: any) {
    return { b64: null, error: error?.message || "Unknown image generation error." };
  }
}

export async function generateAndUploadImage(opts: { postId: string; prompt: string; path?: string; }) {
  const generated = await generateBase64(opts.prompt);
  if (!generated.b64) return { imageUrl: null, error: generated.error };
  const path = opts.path || `daily/${opts.postId}.png`;
  const imageUrl = await uploadPngToStorage({ path, base64Png: generated.b64 });
  if (!imageUrl) return { imageUrl: null, error: "Supabase Storage upload failed." };
  return { imageUrl, error: null };
}
