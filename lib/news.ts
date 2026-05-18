import crypto from "crypto";
import type { NewsPost, RawArticle } from "./types";

const NEWS_API_KEY = process.env.NEWS_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_TEXT_MODEL = process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini";
const GENERATE_IMAGES = process.env.GENERATE_IMAGES === "true";

const TOPICS = [
  "world",
  "business",
  "technology",
  "science",
  "health",
  "general"
];

function hash(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex").slice(0, 24);
}

function safeText(input?: string | null) {
  return (input || "").replace(/\s+/g, " ").trim();
}

async function fetchFromNewsApi(): Promise<RawArticle[]> {
  if (!NEWS_API_KEY) return [];

  const url = new URL("https://newsapi.org/v2/top-headlines");
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
      region: "Monde",
    }));
}

async function fetchFromGdelt(): Promise<RawArticle[]> {
  const query = encodeURIComponent("(world OR politics OR economy OR technology OR climate OR health) sourcelang:english");
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
      description: safeText(a.seendate ? `Article détecté par GDELT le ${a.seendate}.` : ""),
      url: a.url,
      sourceName: a.domain || "News source",
      publishedAt: a.seendate || new Date().toISOString(),
      region: "Monde",
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
Tu es rédacteur d'un site de daily news mondial en français.
À partir des articles ci-dessous, crée un JSON strictement valide, sans markdown.

Règles:
- Ne fabrique jamais de fait absent du titre/description.
- Résume chaque news en 1 à 2 phrases simples.
- N'écris pas comme un robot.
- Garde un ton média moderne, clair, légèrement viral mais sérieux.
- Génère un prompt d'image IA éditoriale/conceptuelle.
- L'image prompt ne doit pas créer une fausse photo réaliste d'un événement précis.
- Retourne exactement ce format:
[
  {
    "title": "...",
    "summary": "...",
    "region": "Monde",
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
        { role: "system", content: "Tu réponds uniquement avec du JSON valide." },
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
        region: safeText(ai.region) || article.region || "Monde",
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
  return `Illustration IA éditoriale conceptuelle pour une actualité mondiale: "${article.title}". Style photographie de magazine mais clairement symbolique, pas de fausse scène réelle, pas de logos de médias, composition dramatique, haute qualité.`;
}

function articleToPost(article: RawArticle): NewsPost {
  return {
    id: hash(article.url),
    title: article.title,
    summary: safeText(article.description) || "Résumé indisponible. Consulte la source originale pour plus de détails.",
    region: article.region || "Monde",
    source_name: article.sourceName || "Source",
    source_url: article.url,
    image_prompt: defaultImagePrompt(article),
    image_url: null,
    published_at: article.publishedAt || new Date().toISOString(),
  };
}

async function generateImageDataUrl(prompt: string): Promise<string | null> {
  if (!GENERATE_IMAGES || !OPENAI_API_KEY) return null;

  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1",
      prompt,
      size: "1024x1024"
    }),
  });

  if (!res.ok) {
    console.error("OpenAI image error", await res.text());
    return null;
  }

  const data = await res.json();
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) return null;

  return `data:image/png;base64,${b64}`;
}

export async function buildDailyPosts(): Promise<NewsPost[]> {
  const apiArticles = await fetchFromNewsApi();
  const gdeltArticles = apiArticles.length ? [] : await fetchFromGdelt();

  const articles = pickDiverseArticles([...apiArticles, ...gdeltArticles], 6);
  const posts = await summarizeWithOpenAI(articles);

  const enriched: NewsPost[] = [];
  for (const post of posts) {
    const imageUrl = await generateImageDataUrl(post.image_prompt);
    enriched.push({ ...post, image_url: imageUrl });
  }

  return enriched;
}
