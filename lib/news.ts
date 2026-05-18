import crypto from "crypto";
import { generateAndUploadImage } from "./image";
import { categorizeText } from "./categories";
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
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function safeText(input?: string | null) {
  return (input || "").replace(/\s+/g, " ").trim();
}

function formatSourceName(hostOrName?: string | null) {
  return safeText(hostOrName) || "Source";
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

function uniqueByUrl(articles: RawArticle[]) {
  const seen = new Set<string>();
  return articles.filter((a) => {
    if (!a.url || seen.has(a.url)) return false;
    seen.add(a.url);
    return true;
  });
}

function diversify(articles: RawArticle[], limit = 12) {
  const domains = new Set<string>();
  const out: RawArticle[] = [];
  for (const article of articles) {
    try {
      const domain = new URL(article.url).hostname.replace(/^www\./, "");
      if (domains.has(domain)) continue;
      domains.add(domain);
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
  return [
    `Create a highly realistic AI-generated editorial image for a ${section.label} news story.`,
    `Story context: ${article.title}.`,
    `Use a photoreal, newspaper-feature style with believable lighting, rich environmental detail, strong composition and authentic U.S. visual cues when relevant.`,
    `The image must be illustrative, not deceptive: do not present it as a real event photo, avoid logos, watermarks, fake network bugs, fake text overlays, or exact identifiable private people.`,
    `The result should feel like a premium American news-site illustration that could sit on a homepage lead card.`
  ].join(" ");
}

function articleToPost(article: RawArticle): NewsPost {
  const section = categorizeText(`${article.title} ${article.description || ""}`);
  const slug = slugify(article.title);
  return {
    id: hash(article.url),
    slug,
    title: article.title,
    dek: article.description || "A quick look at one of the day’s important stories in the United States.",
    summary: article.description || "Read the original source for more detail.",
    body: article.description || "Further details were limited in the source snapshot available at publish time.",
    category: section.slug,
    subcategory: section.subcategories[0],
    region: "USA",
    source_name: formatSourceName(article.sourceName),
    source_url: article.url,
    image_prompt: defaultImagePrompt(article),
    image_alt: `AI-generated editorial illustration for: ${article.title}`,
    image_url: null,
    published_at: article.publishedAt || new Date().toISOString()
  };
}

async function summarizeWithOpenAI(articles: RawArticle[]): Promise<NewsPost[]> {
  const fallback = articles.map(articleToPost);
  if (!OPENAI_API_KEY || articles.length === 0) return fallback;

  const articleBlock = articles.map((a, i) => (
    `${i + 1}. TITLE: ${a.title}\nSOURCE: ${a.sourceName}\nURL: ${a.url}\nDESCRIPTION: ${a.description || ""}\nPUBLISHED: ${a.publishedAt || ""}`
  )).join("\n\n");

  const prompt = `You are building structured copy for a premium American digital news site.
Return strictly valid JSON with one object per article and no markdown.

Rules:
- Use only the information contained in the title and description.
- Do not fabricate facts, names, casualty counts, motives, causes, quotes or outcomes.
- If information is limited, write in cautious language such as "officials have not released further details" or "details remained limited in available reporting".
- Write in clear, natural American English.
- For each article return: title, dek, summary, body, category, subcategory, image_prompt, image_alt.
- body should be 2 to 4 short paragraphs separated by \n\n and should read like a concise web article.
- summary should be 2 to 3 sentences.
- dek should be one short sentence.
- category must be one of: politics, national, world, business, technology, climate, health, style, opinion.
- subcategory should plausibly fit the category.
- image_prompt must ask for a highly realistic editorial illustration in a premium U.S. news-site style, but it must clearly remain illustrative and not pretend to be a real photo.
- image_alt should clearly label the visual as an AI-generated editorial illustration.

Articles:\n${articleBlock}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: OPENAI_TEXT_MODEL,
      temperature: 0.3,
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
      const baseSection = categorizeText(`${article.title} ${article.description || ""}`);
      const category = ["politics", "national", "world", "business", "technology", "climate", "health", "style", "opinion"].includes(ai.category) ? ai.category : baseSection.slug;
      return {
        id: hash(article.url),
        slug: slugify(ai.title || article.title),
        title: safeText(ai.title) || article.title,
        dek: safeText(ai.dek) || article.description || "A developing story in today’s U.S. news cycle.",
        summary: safeText(ai.summary) || article.description || "Read the original source for more detail.",
        body: safeText(ai.body?.replace(/\n\n/g, "\n\n")) || article.description || "Further details were limited in the available source snapshot.",
        category,
        subcategory: safeText(ai.subcategory) || baseSection.subcategories[0],
        region: "USA",
        source_name: formatSourceName(article.sourceName),
        source_url: article.url,
        image_prompt: safeText(ai.image_prompt) || defaultImagePrompt(article),
        image_alt: safeText(ai.image_alt) || `AI-generated editorial illustration for: ${article.title}`,
        image_url: null,
        published_at: article.publishedAt || new Date().toISOString()
      };
    });
  } catch (error) {
    console.error("JSON parse error", error);
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
  const newsApi = await fetchFromNewsApi();
  const articles = diversify(uniqueByUrl(newsApi), 12);
  const posts = await summarizeWithOpenAI(articles);
  return attachImages(posts);
}
