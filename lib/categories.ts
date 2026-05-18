import type { NewsPost, SectionConfig } from "./types";

export const SECTIONS: SectionConfig[] = [
  {
    slug: "politics",
    label: "Politics",
    description: "The White House, Congress, campaigns, courts and power in America.",
    subcategories: ["White House", "Congress", "Campaigns", "Courts", "Policy"],
    keywords: ["trump", "biden", "white house", "senate", "congress", "election", "campaign", "governor", "policy", "supreme court", "justice department", "lawmakers"],
    query: "Trump OR Biden OR Congress OR Senate OR White House OR Supreme Court"
  },
  {
    slug: "national",
    label: "National",
    description: "Big stories from across the United States.",
    subcategories: ["Public Safety", "Education", "Law", "Society", "States"],
    keywords: ["u.s.", "america", "american", "texas", "california", "florida", "new york", "police", "court", "school", "fire", "storm"],
    newsApiCategory: "general"
  },
  {
    slug: "world",
    label: "World",
    description: "Major global developments with U.S. relevance.",
    subcategories: ["Europe", "Middle East", "Asia", "Americas", "Africa"],
    keywords: ["ukraine", "russia", "china", "iran", "israel", "gaza", "india", "europe", "middle east", "nato", "foreign"],
    query: "Ukraine OR Russia OR China OR Iran OR Israel OR Gaza OR NATO"
  },
  {
    slug: "business",
    label: "Business",
    description: "Markets, companies, inflation, jobs and the economy.",
    subcategories: ["Markets", "Economy", "Companies", "Labor", "Personal Finance"],
    keywords: ["market", "stocks", "economy", "jobs", "inflation", "tariff", "company", "business", "earnings", "fed", "rates", "bank"],
    newsApiCategory: "business"
  },
  {
    slug: "technology",
    label: "Tech",
    description: "Technology, AI, the internet, cybersecurity and devices.",
    subcategories: ["Artificial Intelligence", "Internet Culture", "Tech Policy", "Cybersecurity", "Startups"],
    keywords: ["ai", "artificial intelligence", "google", "apple", "meta", "microsoft", "technology", "tech", "software", "chip", "cyber"],
    newsApiCategory: "technology"
  },
  {
    slug: "climate",
    label: "Climate",
    description: "Climate, weather, energy and the environment.",
    subcategories: ["Weather", "Energy", "Environment", "Climate Policy", "Extreme Events"],
    keywords: ["climate", "weather", "energy", "environment", "heat", "flood", "wildfire", "storm", "hurricane", "tornado"],
    query: "climate OR weather OR wildfire OR hurricane OR tornado OR flooding OR energy"
  },
  {
    slug: "health",
    label: "Health",
    description: "Health, medicine, science and well-being.",
    subcategories: ["Public Health", "Medicine", "Science", "Research", "Wellness"],
    keywords: ["health", "virus", "disease", "hospital", "doctor", "medical", "cdc", "outbreak", "science", "vaccine", "wellness"],
    newsApiCategory: "health"
  },
  {
    slug: "sports",
    label: "Sports",
    description: "Major leagues, athletes and the business of sports.",
    subcategories: ["NFL", "NBA", "MLB", "College", "Combat Sports"],
    keywords: ["nfl", "nba", "mlb", "nhl", "wnba", "ufc", "boxing", "sports", "player", "coach", "team"],
    newsApiCategory: "sports"
  },
  {
    slug: "style",
    label: "Style",
    description: "Culture, media, entertainment and how America lives now.",
    subcategories: ["Culture", "Media", "Entertainment", "Fashion", "Food & Travel"],
    keywords: ["culture", "movie", "music", "celebrity", "fashion", "hollywood", "media", "restaurant", "travel", "food", "lifestyle"],
    newsApiCategory: "entertainment"
  },
  {
    slug: "opinion",
    label: "Opinion",
    description: "Perspective, argument and analysis.",
    subcategories: ["Columns", "Editorials", "Analysis"],
    keywords: ["opinion", "analysis", "column", "editorial", "perspective", "argues"],
    query: "analysis OR opinion OR column politics economy America"
  }
];

export const PRIMARY_NAV = SECTIONS.map((section) => ({ slug: section.slug, label: section.label }));

export function getSectionBySlug(slug: string) {
  return SECTIONS.find((section) => section.slug === slug);
}

export function categorizeText(text: string) {
  const haystack = text.toLowerCase();
  let best = SECTIONS[1];
  let bestScore = 0;

  for (const section of SECTIONS) {
    const score = section.keywords.reduce((acc, keyword) => acc + (haystack.includes(keyword.toLowerCase()) ? 1 : 0), 0);
    if (score > bestScore) {
      best = section;
      bestScore = score;
    }
  }

  return best;
}

export function ensureCategory(post: NewsPost) {
  return getSectionBySlug(post.category) ? post.category : categorizeText(`${post.title} ${post.summary} ${post.source_name}`).slug;
}

export function postsBySection(posts: NewsPost[]) {
  return SECTIONS.map((section) => ({
    section,
    posts: posts.filter((post) => ensureCategory(post) === section.slug)
  }));
}

// Compatibility for older folders that may remain in GitHub after web uploads.
export const CATEGORIES = SECTIONS;
export const getCategoryBySlug = getSectionBySlug;
export function categorizePost(post: NewsPost) {
  return getSectionBySlug(ensureCategory(post)) || SECTIONS[1];
}
export function getFeaturedByCategory(posts: NewsPost[]) {
  return postsBySection(posts).map(({ section, posts }) => ({ category: section, posts }));
}
