import { categorizeText, getSectionBySlug } from "./categories";
import type { RawArticle, NewsPost } from "./types";

function compact(input?: string | null) {
  return (input || "").replace(/\s+/g, " ").trim();
}

function containsAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

export function buildEditorialImagePrompt(input: {
  title: string;
  summary?: string | null;
  category?: string | null;
  subcategory?: string | null;
  region?: string | null;
}) {
  const title = compact(input.title);
  const summary = compact(input.summary);
  const category = compact(input.category);
  const subcategory = compact(input.subcategory);
  const region = compact(input.region) || "United States";
  const lower = `${title} ${summary} ${category} ${subcategory}`.toLowerCase();

  const baseRules = [
    "Create an ultra-realistic editorial photo illustration for a premium American digital news site.",
    "Use realistic news-photo composition: documentary framing, natural camera perspective, believable scale, realistic lighting, realistic shadows, realistic weather and material physics, natural imperfections, no glossy advertising look.",
    "The scene must be visually plausible and grounded in the article topic.",
    "Avoid sensational exaggeration, movie-poster lighting, fantasy scale, surreal effects, impossible anatomy, duplicated people, distorted faces or people in physically impossible positions.",
    "No gore, no graphic injuries, no dead bodies, no victims visible, no weapons foregrounded.",
    "No text overlays, no captions inside the image, no logos, no watermarks, no UI elements, no fake TV lower thirds.",
    "Do not create a misleading replica of a real copyrighted news photo. Create an original editorial illustration inspired only by the article context.",
  ];

  const fireRules = [
    "Fire/disaster-specific rules: show a believable American warehouse or industrial building fire from a safe news-camera distance.",
    "Flames must originate from the structure, roofline, loading dock, windows or smoke vents — not from the open ground like lava or a volcano.",
    "Firefighters, police and civilians must be outside the fire perimeter, at a realistic operational distance, never inside flames, never walking through fire, never touching flames.",
    "Use realistic smoke plumes, wet pavement, emergency lights, fire hoses, blocked-off streets, and an industrial Texas setting when relevant.",
    "Avoid giant fireballs, explosions, molten-lava textures, apocalyptic scale, or people surrounded by flames.",
  ];

  const healthRules = [
    "Public-health rules: use a realistic hospital corridor, public-health briefing room, lab exterior, airport screening area, or medical operations setting.",
    "Show medical staff or officials in believable positions and lighting. Do not use unrelated fires, explosions, disaster scenes or panicked crowds.",
    "Avoid close-up virus graphics unless the article is specifically about scientific research.",
  ];

  const politicsRules = [
    "Politics/government rules: show a credible Washington or state-government setting, press microphones, courthouse exterior, Capitol/White House style architecture, voting site, or press-room context as relevant.",
    "Do not show unrelated fire, crime tape, riots, or disaster imagery unless the article explicitly involves that.",
  ];

  const businessRules = [
    "Business/economy rules: show realistic offices, storefronts, factories, shipping, markets, bank exteriors, commuting, or workplace details related to the story.",
    "Avoid fake stock charts with readable numbers or fictional brand logos.",
  ];

  const techRules = [
    "Technology rules: show realistic devices, data centers, engineers, offices, semiconductor/lab settings, or policy hearing context.",
    "Avoid sci-fi holograms, neon cyberpunk visuals, fake readable code or invented company logos.",
  ];

  const climateRules = [
    "Climate/weather rules: show realistic weather, heat, flooding, wildfire smoke, energy infrastructure, or environmental monitoring scenes as relevant.",
    "Use believable scale and real-world physics; avoid apocalyptic fantasy visuals.",
  ];

  const sportsRules = [
    "Sports rules: show realistic game-day, training, arena, course, sideline or press-conference imagery.",
    "Do not use team logos or identifiable celebrity athlete likenesses.",
  ];

  const styleRules = [
    "Style/culture rules: show realistic culture, entertainment, street style, media event or lifestyle context.",
    "No celebrity likenesses, no brand logos, no red-carpet logos.",
  ];

  const sectionRules = (() => {
    if (containsAny(lower, ["fire", "blaze", "arson", "warehouse", "explosion", "smoke", "burning"])) return fireRules;
    if (containsAny(lower, ["outbreak", "virus", "health", "who", "hospital", "disease", "cdc", "medical", "patient"])) return healthRules;
    if (containsAny(lower, ["white house", "senate", "congress", "president", "election", "campaign", "court", "justice", "policy"])) return politicsRules;
    if (containsAny(lower, ["market", "stock", "company", "economy", "business", "tariff", "jobs", "inflation", "retail"])) return businessRules;
    if (containsAny(lower, ["ai", "technology", "tech", "cyber", "google", "apple", "microsoft", "chip", "software"])) return techRules;
    if (containsAny(lower, ["climate", "storm", "weather", "heat", "flood", "wildfire", "environment", "energy"])) return climateRules;
    if (containsAny(lower, ["nba", "nfl", "mlb", "golf", "championship", "sports", "game", "athlete"])) return sportsRules;
    if (containsAny(lower, ["style", "culture", "movie", "music", "fashion", "celebrity", "media"])) return styleRules;
    return [];
  })();

  return [
    ...baseRules,
    ...sectionRules,
    `Region/context: ${region}.`,
    `Article title: ${title}.`,
    `Article summary: ${summary || "Details are limited in available reporting."}.`,
    `Category: ${category || "news"}.`,
    `Subcategory: ${subcategory || "general"}.`,
    "The generated visual must match the article topic accurately and avoid reusing visual ideas from unrelated stories.",
  ].join(" ");
}

export function buildPromptForArticle(article: RawArticle, category: string, summary?: string | null, subcategory?: string | null) {
  const section = getSectionBySlug(category) || categorizeText(`${article.title} ${article.description || ""}`);
  return buildEditorialImagePrompt({
    title: article.title,
    summary: summary || article.description || "",
    category: section.slug,
    subcategory: subcategory || section.subcategories[0],
    region: "United States",
  });
}

export function buildPromptForPost(post: Pick<NewsPost, "title" | "summary" | "category" | "subcategory" | "region">) {
  return buildEditorialImagePrompt({
    title: post.title,
    summary: post.summary,
    category: post.category,
    subcategory: post.subcategory,
    region: post.region,
  });
}

export function buildAuthorPortraitPrompt(input: { name: string; title: string; beat: string }) {
  return [
    `Create a realistic professional newsroom profile headshot for a fictional journalist named ${input.name}.`,
    `Role: ${input.title}. Beat: ${input.beat}.`,
    "Head-and-shoulders framing, professional but approachable expression, subtle natural imperfections, realistic skin texture, neutral studio or newsroom background, soft natural light, editorial staff-directory style.",
    "No text, no logos, no watermark, no celebrity likeness, no resemblance to a specific real public figure.",
  ].join(" ");
}
