import crypto from "crypto";
import { getAuthorForCategory } from "./authors";
import { categorizeText, getSectionBySlug, SECTIONS } from "./categories";
import { generateAndUploadImage } from "./image";
import { toEmbedUrl } from "./video";
import type { NewsPost, RawArticle } from "./types";

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

function slugify(input: string) {
  const slug = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 84);
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
  url.searchParams.set("pageSize", "8");
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
      requestedCategory: sectionSlug
    }));
}

async function fetchEverything(sectionSlug: string, query: string) {
  if (!NEWS_API_KEY) return [] as RawArticle[];
  const url = new URL("https://newsapi.org/v2/everything");
  url.searchParams.set("q", query);
  url.searchParams.set("language", "en");
  url.searchParams.set("sortBy", "publishedAt");
  url.searchParams.set("from", isoDaysAgo(2));
  url.searchParams.set("pageSize", "8");
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
      requestedCategory: sectionSlug
    }));
}

async function fetchDailyArticles(): Promise<RawArticle[]> {
  const batches = await Promise.all(SECTIONS.map((section) => {
    if (section.newsApiCategory) return fetchTopHeadlines(section.slug, section.newsApiCategory);
    return fetchEverything(section.slug, section.query || section.label);
  }));

  const all = batches.flat();
  const seen = new Set<string>();
  const out: RawArticle[] = [];

  for (const article of all) {
    if (!article.url || seen.has(article.url)) continue;
    seen.add(article.url);
    out.push(article);
    if (out.length >= 18) break;
  }

  return out;
}

function defaultImagePrompt(article: RawArticle, category: string) {
  const section = getSectionBySlug(category) || categorizeText(`${article.title} ${article.description || ""}`);
  return [
    `Create a highly realistic AI-generated editorial news image for a ${section.label} story.`,
    `Story context: ${article.title}.`,
    `Use photorealistic American digital-news photography style, natural lighting, believable locations, rich details and strong editorial composition.`,
    `Avoid exact identifiable private people, logos, watermarks, fake lower-thirds, readable text overlays or anything that claims to be a real event photograph.`
  ].join(" ");
}

function articleToPost(article: RawArticle): NewsPost {
  const section = getSectionBySlug(article.requestedCategory || "") || categorizeText(`${article.title} ${article.description || ""}`);
  const author = getAuthorForCategory(section.slug);
  const body = article.description || "Details were limited in the source snapshot available at publication time. The original source should be reviewed for full context.";
  const videoEmbed = toEmbedUrl(article.url);
  return {
    id: hash(article.url),
    slug: `${slugify(article.title)}-${hash(article.url).slice(0, 6)}`,
    title: article.title,
    dek: article.description || "A developing story in today’s U.S. news cycle.",
    summary: article.description || "Read the original source for more details.",
    body,
    category: section.slug,
    subcategory: section.subcategories[0],
    region: "USA",
    author_name: author.name,
    author_title: author.title,
    reading_time: readingTime(body),
    source_name: article.sourceName || "Source",
    source_url: article.url,
    image_prompt: defaultImagePrompt(article, section.slug),
    image_url: null,
    image_alt: `AI-generated editorial visual for ${article.title}`,
    video_url: videoEmbed ? article.url : null,
    video_embed_url: videoEmbed,
    video_source_name: videoEmbed ? article.sourceName || "Source video" : null,
    video_title: videoEmbed ? article.title : null,
    is_featured: false,
    published_at: article.publishedAt || new Date().toISOString()
  };
}

async function summarizeWithOpenAI(articles: RawArticle[]): Promise<NewsPost[]> {
  const fallback = articles.map(articleToPost);
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
    return articles.map((article, index) => {
      const ai = parsed[index] || {};
      const requested = getSectionBySlug(article.requestedCategory || "");
      const detected = categorizeText(`${article.title} ${article.description || ""}`);
      const category = getSectionBySlug(ai.category) ? ai.category : (requested || detected).slug;
      const section = getSectionBySlug(category) || detected;
      const author = getAuthorForCategory(category);
      const body = safeText(ai.body) || article.description || "Details remained limited in the available source snapshot at publication time.";
      const videoEmbed = toEmbedUrl(article.url);
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
        reading_time: readingTime(body),
        source_name: article.sourceName || "Source",
        source_url: article.url,
        image_prompt: safeText(ai.image_prompt) || defaultImagePrompt(article, category),
        image_url: null,
        image_alt: safeText(ai.image_alt) || `AI-generated editorial visual for ${article.title}`,
        video_url: videoEmbed ? article.url : null,
        video_embed_url: videoEmbed,
        video_source_name: videoEmbed ? article.sourceName || "Source video" : null,
        video_title: videoEmbed ? article.title : null,
        is_featured: index === 0,
        published_at: article.publishedAt || new Date().toISOString()
      };
    });
  } catch (error) {
    console.error("OpenAI JSON parse error", error);
    return fallback;
  }
}

async function attachImages(posts: NewsPost[]): Promise<BuildDailyResult> {
  const imageErrors: BuildDailyResult["imageErrors"] = [];
  const results: NewsPost[] = [];

  for (const post of posts) {
    const image = await generateAndUploadImage({ postId: post.id, prompt: post.image_prompt });
    if (image.error) imageErrors.push({ id: post.id, title: post.title, error: image.error });
    results.push({ ...post, image_url: image.imageUrl });
  }

  return { posts: results, imageErrors };
}

export async function buildDailyPosts(): Promise<BuildDailyResult> {
  const articles = await fetchDailyArticles();
  const posts = await summarizeWithOpenAI(articles);
  return attachImages(posts);
}
