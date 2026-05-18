import crypto from "crypto";
import { getAuthorForCategory, getPublicAuthorAvatarUrl } from "./authors";
import { categorizeText, getSectionBySlug, SECTIONS } from "./categories";
import { generateAndUploadImage } from "./image";
import { findOfficialYoutubeVideo } from "./youtube";
import type { NewsPost, RawArticle } from "./types";

const NEWS_API_KEY = process.env.NEWS_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_TEXT_MODEL = process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini";
const POSTS_PER_SECTION = Math.max(1, Number(process.env.POSTS_PER_SECTION || "1"));
const MAX_DAILY_POSTS = Math.max(6, Number(process.env.MAX_DAILY_POSTS || "10"));
const IMAGE_GENERATION_LIMIT = Math.max(0, Number(process.env.IMAGE_GENERATION_LIMIT || "10"));

export type BuildDailyResult = {
  posts: NewsPost[];
  imageErrors: Array<{ id: string; title: string; error: string }>;
};

function hash(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex").slice(0, 24);
}

function slugify(input: string) {
  const slug = input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 84);
  return slug || `story-${Date.now()}`;
}

function safeText(input?: string | null) {
  return (input || "").replace(/\s+/g, " ").trim();
}

function readingTime(body: string) {
  const words = safeText(body).split(" ").filter(Boolean).length;
  return Math.max(2, Math.ceil(words / 220));
}

function isoDaysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

async function fetchTopHeadlines(sectionSlug: string, category?: string) {
  if (!NEWS_API_KEY) return [] as RawArticle[];
  const url = new URL("https://newsapi.org/v2/top-headlines");
  url.searchParams.set("country", "us");
  url.searchParams.set("language", "en");
  url.searchParams.set("pageSize", "12");
  if (category) url.searchParams.set("category", category);
  url.searchParams.set("apiKey", NEWS_API_KEY);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    console.error(`NewsAPI top-headlines error for ${sectionSlug}`, await res.text());
    return [];
  }

  const data = await res.json();
  return (data.articles || [])
    .filter((a: any) => a?.title && a?.url && !String(a.title).includes("[Removed]"))
    .map((a: any) => ({
      title: safeText(a.title),
      description: safeText(a.description || a.content),
      url: a.url,
      sourceName: a.source?.name || "News source",
      publishedAt: a.publishedAt || new Date().toISOString(),
      requestedCategory: sectionSlug,
      sourceImageUrl: a.urlToImage || null
    }));
}

async function fetchEverything(sectionSlug: string, query: string) {
  if (!NEWS_API_KEY) return [] as RawArticle[];
  const url = new URL("https://newsapi.org/v2/everything");
  url.searchParams.set("q", query);
  url.searchParams.set("language", "en");
  url.searchParams.set("sortBy", "publishedAt");
  url.searchParams.set("from", isoDaysAgo(2));
  url.searchParams.set("pageSize", "12");
  url.searchParams.set("apiKey", NEWS_API_KEY);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    console.error(`NewsAPI everything error for ${sectionSlug}`, await res.text());
    return [];
  }

  const data = await res.json();
  return (data.articles || [])
    .filter((a: any) => a?.title && a?.url && !String(a.title).includes("[Removed]"))
    .map((a: any) => ({
      title: safeText(a.title),
      description: safeText(a.description || a.content),
      url: a.url,
      sourceName: a.source?.name || "News source",
      publishedAt: a.publishedAt || new Date().toISOString(),
      requestedCategory: sectionSlug,
      sourceImageUrl: a.urlToImage || null
    }));
}

async function fetchDailyArticles(): Promise<RawArticle[]> {
  const batches = await Promise.all(SECTIONS.map(async (section) => {
    const articles = section.newsApiCategory
      ? await fetchTopHeadlines(section.slug, section.newsApiCategory)
      : await fetchEverything(section.slug, section.query || section.label);
    return { section, articles };
  }));

  const seen = new Set<string>();
  const out: RawArticle[] = [];

  // Round-robin keeps the site populated across categories instead of filling only Politics/National.
  for (let round = 0; round < POSTS_PER_SECTION; round++) {
    for (const batch of batches) {
      const article = batch.articles.find((candidate: RawArticle) => !seen.has(candidate.url));
      if (!article) continue;
      seen.add(article.url);
      out.push(article);
      batch.articles = batch.articles.filter((candidate) => candidate.url !== article.url);
      if (out.length >= MAX_DAILY_POSTS) return out;
    }
  }

  return out;
}

function defaultImagePrompt(article: RawArticle, category: string) {
  const section = getSectionBySlug(category) || categorizeText(`${article.title} ${article.description || ""}`);
  return [
    `Create a highly realistic AI-generated editorial news visual for a ${section.label} story.`,
    `Story context: ${article.title}.`,
    `Use premium U.S. digital-news photojournalism aesthetics: realistic light, believable location, sharp detail, natural camera perspective, serious editorial tone.`,
    `Do not include logos, watermarks, text overlays, fake lower-thirds, identifiable private people or anything claiming to be a real event photograph.`,
    `The image should look credible and immersive, while remaining a clearly illustrative AI editorial visual.`
  ].join(" ");
}

function buildPostFromArticle(article: RawArticle, ai: any = {}): NewsPost {
  const requested = getSectionBySlug(article.requestedCategory || "");
  const detected = categorizeText(`${article.title} ${article.description || ""}`);
  const category = requested?.slug || (getSectionBySlug(ai.category) ? ai.category : detected.slug);
  const section = getSectionBySlug(category) || detected;
  const author = getAuthorForCategory(category);
  const body = safeText(ai.body) || article.description || "Details remained limited in the source snapshot available at publication time. The original source should be reviewed for full context.";
  const avatarUrl = author.photoEligible ? getPublicAuthorAvatarUrl(author) : null;

  return {
    id: hash(article.url),
    slug: `${slugify(ai.title || article.title)}-${hash(article.url).slice(0, 6)}`,
    title: safeText(ai.title) || article.title,
    dek: safeText(ai.dek) || article.description || "A developing story in today’s U.S. news cycle.",
    summary: safeText(ai.summary) || article.description || "Read the original source for more details.",
    body,
    category,
    subcategory: safeText(ai.subcategory) || section.subcategories[0],
    region: "USA",
    author_name: author.name,
    author_title: author.title,
    author_avatar_url: avatarUrl,
    author_photo_note: avatarUrl ? "AI-generated fictional newsroom portrait." : null,
    reading_time: readingTime(body),
    source_name: article.sourceName || "Source",
    source_url: article.url,
    image_prompt: safeText(ai.image_prompt) || defaultImagePrompt(article, category),
    image_url: null,
    image_alt: safeText(ai.image_alt) || `AI-generated editorial visual for ${article.title}`,
    video_url: null,
    video_embed_url: null,
    video_source_name: null,
    video_title: null,
    is_featured: false,
    published_at: article.publishedAt || new Date().toISOString()
  };
}

async function summarizeWithOpenAI(articles: RawArticle[]): Promise<NewsPost[]> {
  const fallback = articles.map((article) => buildPostFromArticle(article));
  if (!OPENAI_API_KEY || articles.length === 0) return fallback;

  const articleBlock = articles.map((a, i) => (
    `${i + 1}. REQUESTED_CATEGORY: ${a.requestedCategory || "auto"}\nTITLE: ${a.title}\nSOURCE: ${a.sourceName}\nURL: ${a.url}\nDESCRIPTION: ${a.description || ""}\nPUBLISHED: ${a.publishedAt || ""}`
  )).join("\n\n");

  const prompt = `You are creating structured content for a premium American digital news site.
Return strictly valid JSON with one object per article and no markdown.

Important factual rules:
- Use only the provided title, description, URL/source metadata and cautious inference from those fields.
- Do not invent names, casualty counts, causes, motives, quotes, police findings or outcomes.
- If details are missing, say details remain limited in available reporting.
- Do not write as if the site did original reporting unless the source says so.

Editorial rules:
- Write in polished American English.
- Create a realistic newsroom-style article package.
- category must stay aligned with REQUESTED_CATEGORY unless the article obviously belongs elsewhere.
- category must be one of: politics, national, world, business, technology, climate, health, sports, style, opinion.
- body must be 3 to 5 short paragraphs separated by \n\n.
- dek is one strong sentence under the headline.
- summary is 2 to 3 sentences.
- image_prompt must request a photorealistic, high-detail editorial AI visual, but must not pretend to be an actual event photo.
- image_alt must explicitly mention AI-generated editorial visual.

Return JSON format:
[
  {
    "title":"...",
    "dek":"...",
    "summary":"...",
    "body":"paragraph 1\n\nparagraph 2\n\nparagraph 3",
    "category":"national",
    "subcategory":"Public Safety",
    "image_prompt":"...",
    "image_alt":"..."
  }
]

Articles:\n${articleBlock}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: OPENAI_TEXT_MODEL,
      temperature: 0.25,
      messages: [
        { role: "system", content: "You only respond with valid JSON." },
        { role: "user", content: prompt }
      ]
    })
  });

  if (!res.ok) {
    console.error("OpenAI text error", await res.text());
    return fallback;
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || "[]";

  try {
    const parsed = JSON.parse(content);
    return articles.map((article, index) => buildPostFromArticle(article, parsed[index] || {}));
  } catch (error) {
    console.error("JSON parse error", error);
    return fallback;
  }
}

async function attachVideos(posts: NewsPost[]) {
  const results: NewsPost[] = [];
  for (const post of posts) {
    const video = await findOfficialYoutubeVideo({ title: post.title, sourceName: post.source_name, category: post.category });
    results.push(video ? { ...post, ...video } : post);
  }
  return results;
}

async function attachImages(posts: NewsPost[]): Promise<BuildDailyResult> {
  const imageErrors: BuildDailyResult["imageErrors"] = [];
  const results: NewsPost[] = [];

  for (let index = 0; index < posts.length; index++) {
    const post = posts[index];
    if (index >= IMAGE_GENERATION_LIMIT) {
      results.push(post);
      continue;
    }
    const image = await generateAndUploadImage({ postId: post.id, prompt: post.image_prompt });
    if (image.error) imageErrors.push({ id: post.id, title: post.title, error: image.error });
    results.push({ ...post, image_url: image.imageUrl });
  }

  return { posts: results, imageErrors };
}

export async function buildDailyPosts(): Promise<BuildDailyResult> {
  const articles = await fetchDailyArticles();
  const summarized = await summarizeWithOpenAI(articles);
  const withVideos = await attachVideos(summarized);
  return attachImages(withVideos);
}
