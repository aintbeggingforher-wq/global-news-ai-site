import type { NewsPost } from "./types";

export type Category = {
  slug: string;
  label: string;
  description: string;
  keywords: string[];
};

export const CATEGORIES: Category[] = [
  {
    slug: "politics",
    label: "Politics",
    description: "Washington, campaigns, Congress, the White House and power in America.",
    keywords: ["trump", "biden", "white house", "senate", "congress", "republican", "democrat", "election", "campaign", "governor", "supreme court", "justice department", "lawmakers"],
  },
  {
    slug: "national",
    label: "National",
    description: "The biggest stories across the United States.",
    keywords: ["u.s.", "us ", "america", "american", "state", "police", "court", "school", "shooting", "fire", "texas", "california", "florida", "new york"],
  },
  {
    slug: "world",
    label: "World",
    description: "Global stories with clear U.S. relevance.",
    keywords: ["ukraine", "russia", "china", "israel", "gaza", "iran", "india", "europe", "mexico", "canada", "nato", "war", "foreign"],
  },
  {
    slug: "business",
    label: "Business",
    description: "Markets, companies, work, money and the economy.",
    keywords: ["market", "stocks", "wall street", "economy", "jobs", "inflation", "company", "business", "fed", "rates", "tariff", "earnings", "bank"],
  },
  {
    slug: "technology",
    label: "Technology",
    description: "Tech, AI, platforms, cybersecurity and the digital economy.",
    keywords: ["ai", "artificial intelligence", "google", "apple", "meta", "microsoft", "cyber", "technology", "tech", "software", "chip", "robot", "data"],
  },
  {
    slug: "climate",
    label: "Climate",
    description: "Climate, environment, energy and extreme weather.",
    keywords: ["climate", "storm", "hurricane", "weather", "flood", "wildfire", "heat", "energy", "environment", "tornado", "severe storms"],
  },
  {
    slug: "health",
    label: "Health",
    description: "Health, medicine, science and public well-being.",
    keywords: ["health", "virus", "disease", "hospital", "doctor", "medical", "cdc", "vaccine", "outbreak", "science", "wellness", "hantavirus"],
  },
  {
    slug: "style",
    label: "Style",
    description: "Culture, media, celebrity, entertainment and American life.",
    keywords: ["style", "culture", "movie", "music", "celebrity", "fashion", "hollywood", "sports", "nfl", "nba", "ufc", "restaurant", "travel", "food"],
  },
  {
    slug: "opinion",
    label: "Opinion",
    description: "Analysis, argument and perspective.",
    keywords: ["opinion", "analysis", "column", "editorial", "debate", "argues", "essay"],
  },
];

export const PRIMARY_NAV = [
  CATEGORIES[0],
  CATEGORIES[1],
  CATEGORIES[2],
  CATEGORIES[3],
  CATEGORIES[4],
  CATEGORIES[5],
  CATEGORIES[6],
  CATEGORIES[7],
];

export function getCategoryBySlug(slug: string) {
  return CATEGORIES.find((category) => category.slug === slug);
}

export function categorizePost(post: NewsPost): Category {
  const haystack = `${post.title} ${post.summary} ${post.source_name}`.toLowerCase();

  let best = CATEGORIES[1];
  let bestScore = 0;

  for (const category of CATEGORIES) {
    const score = category.keywords.reduce((total, keyword) => {
      return haystack.includes(keyword.toLowerCase()) ? total + 1 : total;
    }, 0);

    if (score > bestScore) {
      best = category;
      bestScore = score;
    }
  }

  return best;
}

export function getFeaturedByCategory(posts: NewsPost[]) {
  return CATEGORIES.map((category) => ({
    category,
    posts: posts.filter((post) => categorizePost(post).slug === category.slug),
  }));
}
