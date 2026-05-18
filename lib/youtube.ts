const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const VIDEO_PROBABILITY = Number(process.env.VIDEO_PROBABILITY || "0.25");

function shouldAttachVideo(seed: string) {
  if (!YOUTUBE_API_KEY) return false;
  let total = 0;
  for (const char of seed) total += char.charCodeAt(0);
  return (total % 100) / 100 < VIDEO_PROBABILITY;
}

export async function findOfficialYoutubeVideo(opts: { title: string; sourceName?: string | null; category?: string | null; }) {
  if (!shouldAttachVideo(opts.title)) return null;
  if (!YOUTUBE_API_KEY) return null;

  const query = `${opts.title} ${opts.sourceName || "news"} official news video`;
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("maxResults", "1");
  url.searchParams.set("videoEmbeddable", "true");
  url.searchParams.set("safeSearch", "strict");
  url.searchParams.set("q", query);
  url.searchParams.set("key", YOUTUBE_API_KEY);

  try {
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) {
      console.error("YouTube search error", await res.text());
      return null;
    }
    const data = await res.json();
    const item = data.items?.[0];
    const id = item?.id?.videoId;
    if (!id) return null;
    return {
      video_url: `https://www.youtube.com/watch?v=${id}`,
      video_embed_url: `https://www.youtube.com/embed/${id}`,
      video_source_name: item.snippet?.channelTitle || "YouTube",
      video_title: item.snippet?.title || opts.title
    };
  } catch (error) {
    console.error("YouTube search failed", error);
    return null;
  }
}
