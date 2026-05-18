import { uploadGeneratedImage } from "./storage";

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

export async function generateAndUploadImage(opts: { postId: string; prompt: string; }) {
  if (!GENERATE_IMAGES) return { imageUrl: null, error: "GENERATE_IMAGES is not set to true." };
  if (!OPENAI_API_KEY) return { imageUrl: null, error: "Missing OPENAI_API_KEY." };

  try {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: OPENAI_IMAGE_MODEL,
        prompt: opts.prompt,
        size: "1024x1024"
      })
    });

    if (!res.ok) return { imageUrl: null, error: `OpenAI image error: ${await res.text()}` };

    const data = await res.json();
    const b64 = data.data?.[0]?.b64_json;
    if (!b64) return { imageUrl: null, error: "No b64_json returned by the image API." };

    const imageUrl = await uploadGeneratedImage({ postId: opts.postId, base64Png: b64 });
    if (!imageUrl) return { imageUrl: null, error: "Supabase Storage upload failed." };

    return { imageUrl, error: null };
  } catch (error: any) {
    return { imageUrl: null, error: error?.message || "Unknown image generation error." };
  }
}
