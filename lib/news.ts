import crypto from "crypto";
import { getAuthorForCategory } from "./authors";
import { categorizeText } from "./categories";
import { readingTimeFromText } from "./format";
import { generateAndUploadImage } from "./image";
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
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

function safeText(input?: string | null) {
  return (input || "").replace(/\s+/g, " ").trim();
}

function safeBody(input?: string | null) {
  return (input || "").replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim();
}

async function fetchFromNewsApi(): Promise<RawArticle[]> {
  if (!NEWS_API_KEY) return [];
  const url = new URL("https://newsapi.org/v2/top-headlines");
  url.searchParams.set("country", "us");
  url.searchParams.set("language", "en");
  url.searchParams.set("pageSize", "24");
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
      region: "USA"
    }));
}

function diversify(articles: RawArticle[], limit = 12) {
  const seenUrls = new Set<string>();
  const seenDomains = new Set<string>();
  const out: RawArticle[] = [];
  for (const article of articles) {
    try {
      const domain = new URL(article.url).hostname.replace(/^www\./, "");
      if (seenUrls.has(article.url) || seenDomains.has(domain)) continue;
      seenUrls.add(article.url);
      seenDomains.add(domain);
      out.push(article);
      if (out.length >= limit) break;
    } catch {
      continue;
    }
  }
  return out;
}

function defaultImagePrompt(article: RawArticle) {
  const section = categorizeText(`${article.title} ${article.description || ""}`);
  return `Create a highly realistic AI-generated editorial image for a ${section.label} news story. Story context: ${article.title}. Use a premium American digital-news photojournalism look: believable natural lighting, detailed setting, strong composition, realistic materials, cinematic but restrained. The image must be illustrative and must not pretend to be a real event photo. No logos, no watermarks, no readable text overlays, no fake press labels, no exact identifiable private people.`;
}

function fallbackPost(article: RawArticle): NewsPost {
  const section = categorizeText(`${article.title} ${article.description || ""}`);
  const author = getAuthorForCategory(section.slug);
  const title = article.title;
  const summary = article.description || "Details were limited in the available source snapshot.";
  const body = `${summary}\n\nThe American Desk is linking to the original source for more detail. This brief avoids adding unverified information beyond what was available in the source feed.`;
  return {
    id: hash(article.url),
    slug: `${slugify(title)}-${hash(article.url).slice(0, 6)}`,
    title,
    dek: summary,
    summary,
    body,
    category: section.slug,
    subcategory: section.subcategories[0],
    region: "USA",
    author_name: author.name,
    author_title: author.title,
    reading_time: readingTimeFromText(body),
    source_name: article.sourceName || "Source",
    source_url: article.url,
    image_prompt: defaultImagePrompt(article),
    image_alt: `AI-generated editorial illustration for: ${title}`,
    image_url: null,
    published_at: article.publishedAt || new Date().toISOString()
  };
}

async function buildCopy(articles: RawArticle[]): Promise<NewsPost[]> {
  const fallback = articles.map(fallbackPost);
  if (!OPENAI_API_KEY || articles.length === 0) return fallback;

  const articleBlock = articles.map((a, i) => `${i + 1}. TITLE: ${a.title}\nSOURCE: ${a.sourceName}\nURL: ${a.url}\nDESCRIPTION: ${a.description || ""}\nPUBLISHED: ${a.publishedAt || ""}`).join("\n\n");
  const prompt = `You are an editor for a serious American digital news site.
Return strictly valid JSON. No markdown.

Use only the information in each article's title and description. Do not fabricate names, causes, dates, quotes, casualty counts, motives, locations, official statements or outcomes. If facts are limited, say that details remain limited in available reporting.

For each article, return exactly:
{
  "title": "clear headline",
  "dek": "one sentence under the headline",
  "summary": "2-3 sentence summary",
  "body": "4-6 concise paragraphs separated by \\n\\n. Include: what is known, why it matters, what remains unclear, and a source/context paragraph. Do not invent facts.",
  "category": "one of politics,national,world,business,technology,climate,health,style,opinion",
  "subcategory": "specific subsection",
  "image_prompt": "highly realistic but non-deceptive editorial AI image prompt",
  "image_alt": "AI-generated editorial illustration of ..."
}

Image prompt rules:
- Push realism and detail strongly: photoreal, premium U.S. news-site style, realistic lighting, believable environment.
- Do not ask for a real event photo; the image must remain an illustrative reconstruction.
- No logos, no text overlays, no fake screenshots, no fake press badges, no identifiable private people.

Articles:\n${articleBlock}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: OPENAI_TEXT_MODEL, temperature: 0.25, messages: [{ role: "system", content: "You only output valid JSON." }, { role: "user", content: prompt }] })
  });

  if (!res.ok) {
    console.error("OpenAI text error", await res.text());
    return fallback;
  }
  const data = await res.json();
  try {
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || "[]");
    return articles.map((article, i) => {
      const ai = parsed[i] || {};
      const suggestedSection = categorizeText(`${article.title} ${article.description || ""}`);
      const category = ["politics", "national", "world", "business", "technology", "climate", "health", "style", "opinion"].includes(ai.category) ? ai.category : suggestedSection.slug;
      const author = getAuthorForCategory(category);
      const title = safeText(ai.title) || article.title;
      const body = safeBody(ai.body) || fallback[i].body;
      return {
        id: hash(article.url),
        slug: `${slugify(title)}-${hash(article.url).slice(0, 6)}`,
        title,
        dek: safeText(ai.dek) || fallback[i].dek,
        summary: safeText(ai.summary) || fallback[i].summary,
        body,
        category,
        subcategory: safeText(ai.subcategory) || suggestedSection.subcategories[0],
        region: "USA",
        author_name: author.name,
        author_title: author.title,
        reading_time: readingTimeFromText(body),
        source_name: article.sourceName || "Source",
        source_url: article.url,
        image_prompt: safeText(ai.image_prompt) || defaultImagePrompt(article),
        image_alt: safeText(ai.image_alt) || `AI-generated editorial illustration for: ${title}`,
        image_url: null,
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
  const articles = diversify(await fetchFromNewsApi(), 12);
  const posts = await buildCopy(articles);
  return attachImages(posts);
}
