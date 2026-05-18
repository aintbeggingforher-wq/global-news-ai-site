import { generateEditorialImage, getImageProviderStatus } from "./imageProvider";

export function getImageConfigStatus() {
  return getImageProviderStatus();
}

export async function generateAndUploadImage(opts: { postId: string; prompt: string }) {
  const result = await generateEditorialImage(opts);
  return { imageUrl: result.imageUrl, error: result.error };
}
