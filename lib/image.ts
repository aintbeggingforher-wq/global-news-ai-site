import { uploadGeneratedImage } from "./storage";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";
const GENERATE_IMAGES = process.env.GENERATE_IMAGES === "true";

export type ImageResult = {
  imageUrl: string | null;
  error: string | null;
};

export function getImageConfigStatus() {
  return {
    generateImages: GENERATE_IMAGES,
    hasOpenAIKey: Boolean(OPENAI_API_KEY),
    imageModel: OPENAI_IMAGE_MODEL,
    bucket: process.env.SUPABASE_STORAGE_BUCKET || "news-images",
    hasSupabaseUrl: Boolean(process.env.SUPABASE_URL),
    hasSupabaseServiceKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  };
}

function buildImageRequestBody(prompt: string) {
  const body: Record<string, any> = {
    model: OPENAI_IMAGE_MODEL,
    prompt,
    size: "1024x1024",
    n: 1,
  };

  // DALL·E models return a temporary URL by default.
  // We request base64 so we can upload the image permanently to Supabase Storage.
  if (OPENAI_IMAGE_MODEL.startsWith("dall-e")) {
    body.response_format = "b64_json";
  }

  return body;
}

export async function generateAndUploadImage(opts: {
  postId: string;
  prompt: string;
}): Promise<ImageResult> {
  if (!GENERATE_IMAGES) {
    return { imageUrl: null, error: "GENERATE_IMAGES is not set to true." };
  }

  if (!OPENAI_API_KEY) {
    return { imageUrl: null, error: "Missing OPENAI_API_KEY." };
  }

  try {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildImageRequestBody(opts.prompt)),
    });

    if (!res.ok) {
      const text = await res.text();
      return { imageUrl: null, error: `OpenAI image error: ${text}` };
    }

    const data = await res.json();
    const b64 = data.data?.[0]?.b64_json;

    if (!b64) {
      return {
        imageUrl: null,
        error: "OpenAI did not return b64_json. If you use dall-e-3, make sure response_format=b64_json is supported on your account.",
      };
    }

    const publicUrl = await uploadGeneratedImage({
      postId: opts.postId,
      base64Png: b64,
    });

    if (!publicUrl) {
      return { imageUrl: null, error: "Supabase Storage upload failed. Check bucket name and public bucket permissions." };
    }

    return { imageUrl: publicUrl, error: null };
  } catch (error: any) {
    return { imageUrl: null, error: error?.message || "Unknown image generation error." };
  }
}
