import crypto from "crypto";
import type { NewsPost, RawArticle } from "./types";
import { generateAndUploadImage } from "./image";

const NEWS_API_KEY = process.env.NEWS_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_TEXT_MODEL = process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini";

export type BuildDailyResult = {
  posts: NewsPost[];
  imageErrors: Array<{ id: string; title: string; error: string }>;
};

function hash(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex").slice(0, 24);
}

function safeText(input?: string | null) {
  return (input || "").replace(/\s+/g, " ").trim();
}

async function fetchFromNewsApi(): Promise<RawArticle[]> {
  if (!NEWS_API_KEY) return [];

  const url = new URL("https://newsapi.org/v2/top-headlines");
  url.searchParams.set("country", "us");
  url.searchParams.set("language", "en");
  url.searchParams.set("pageSize", "40");
  url.searchParams.set("apiKey", NEWS_API_KEY);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    console.error("NewsAPI error", await res.text());
    return [];
  }

  const data = await res.json();
  return (data.articles || [])
    .filter((a: any) => a?.title && a?.url)
    .map((a: any) => ({
      title: safeText(a.title),
      description: safeText(a.description || a.content),
      url: a.url,
      sourceName: a.source?.name || "News source",
      publishedAt: a.publishedAt,
      region: "USA",
    }));
}

async function fetchFromGdelt(): Promise<RawArticle[]> {
  const query = encodeURIComponent(
    '(United States OR America OR US politics OR White House OR Congress OR "New York" OR California OR Texas OR Florida) sourcelang:english'
  );
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=ArtList&format=json&maxrecords=40&sort=datedesc`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    console.error("GDELT error", await res.text());
    return [];
  }

  const data = await res.json();
  return (data.articles || [])
    .filter((a: any) => a?.title && a?.url)
    .map((a: any) => ({
      title: safeText(a.title),
      description: safeText(a.seendate ? `Detected by GDELT on ${a.seendate}.` : ""),
      url: a.url,
      sourceName: a.domain || "News source",
      publishedAt: a.seendate || new Date().toISOString(),
      region: "USA",
    }));
}

function pickDiverseArticles(articles: RawArticle[], limit = 6) {
  const seenDomains = new Set<string>();
  const selected: RawArticle[] = [];

  for (const article of articles) {
    try {
      const domain = new URL(article.url).hostname.replace("www.", "");
      if (seenDomains.has(domain)) continue;
      seenDomains.add(domain);
      selected.push(article);
      if (selected.length >= limit) break;
    } catch {
      continue;
    }
  }

  return selected;
}

async function summarizeWithOpenAI(articles: RawArticle[]): Promise<NewsPost[]> {
  const fallback = articles.map(articleToPost);

  if (!OPENAI_API_KEY) return fallback;

  const articleBlock = articles.map((a, i) => (
    `${i + 1}. TITLE: ${a.title}\nSOURCE: ${a.sourceName}\nURL: ${a.url}\nDESC: ${a.description || ""}\nPUBLISHED: ${a.publishedAt || ""}`
  )).join("\n\n");

  const prompt = `
You are an editor for a U.S. daily news website.
Based only on the articles below, create strictly valid JSON. Do not use markdown.

Rules:
- Write everything in natural American English.
- Focus on U.S. relevance.
- Never invent facts that are not present in the title or description.
- Summarize each story in 1 to 2 short sentences.
- Keep the tone clear, modern, and slightly viral, but serious.
- Generate an editorial/conceptual AI image prompt for each story.
- The image prompt must fit the article and should produce a strong news-style illustration.
- The image prompt must not create a fake realistic photo of a real event.
- Prefer editorial illustration, cinematic concept art, or magazine-style breaking-news visuals.
- Return exactly this format:
[
  {
    "title": "...",
    "summary": "...",
    "region": "USA",
    "image_prompt": "..."
  }
]

Articles:
${articleBlock}
`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_TEXT_MODEL,
      temperature: 0.4,
      messages: [
        { role: "system", content: "You only respond with valid JSON." },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    console.error("OpenAI text error", await res.text());
    return fallback;
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || "[]";

  try {
    const parsed = JSON.parse(content);
    return articles.map((article, i) => {
      const ai = parsed[i] || {};
      return {
        id: hash(article.url),
        title: safeText(ai.title) || article.title,
        summary: safeText(ai.summary) || safeText(article.description) || article.title,
        region: "USA",
        source_name: article.sourceName || "Source",
        source_url: article.url,
        image_prompt: safeText(ai.image_prompt) || defaultImagePrompt(article),
        image_url: null,
        published_at: article.publishedAt || new Date().toISOString(),
      };
    });
  } catch (error) {
    console.error("JSON parse error", error);
    return fallback;
  }
}

function defaultImagePrompt(article: RawArticle) {
  return `Editorial conceptual AI illustration for a U.S. news story: "${article.title}". Strong magazine-style breaking-news composition, symbolic and clearly illustrative, not a fake real-world event photo, no news outlet logos, dramatic lighting, high quality.`;
}

function articleToPost(article: RawArticle): NewsPost {
  return {
    id: hash(article.url),
    title: article.title,
    summary: safeText(article.description) || "Summary unavailable. Read the original source for more details.",
    region: "USA",
    source_name: article.sourceName || "Source",
    source_url: article.url,
    image_prompt: defaultImagePrompt(article),
    image_url: null,
    published_at: article.publishedAt || new Date().toISOString(),
  };
}

async function attachImages(posts: NewsPost[]): Promise<BuildDailyResult> {
  const results: NewsPost[] = [];
  const imageErrors: BuildDailyResult["imageErrors"] = [];

  for (const post of posts) {
    const image = await generateAndUploadImage({
      postId: post.id,
      prompt: post.image_prompt,
    });

    if (image.error) {
      imageErrors.push({ id: post.id, title: post.title, error: image.error });
    }

    results.push({
      ...post,
      image_url: image.imageUrl,
    });
  }

  return { posts: results, imageErrors };
}

export async function buildDailyPosts(): Promise<BuildDailyResult> {
  const apiArticles = await fetchFromNewsApi();
  const gdeltArticles = apiArticles.length ? [] : await fetchFromGdelt();

  const articles = pickDiverseArticles([...apiArticles, ...gdeltArticles], 6);
  const posts = await summarizeWithOpenAI(articles);

  return attachImages(posts);
}
