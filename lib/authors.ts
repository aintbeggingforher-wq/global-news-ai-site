import type { AuthorProfile } from "./types";

const AUTHOR_BASE_PROMPT = "Create a realistic AI-generated editorial staff portrait for a fictional digital newsroom. Neutral studio background, natural light, professional but approachable expression, documentary headshot style, no logos, no text, no real person likeness, no celebrity likeness.";

export const AUTHORS: Record<string, AuthorProfile> = {
  politics: {
    name: "Olivia Bennett",
    title: "Politics Correspondent",
    initials: "OB",
    beat: "The White House, Congress and campaigns",
    photoEligible: true,
    avatarPath: "authors/olivia-bennett.png",
    portraitPrompt: `${AUTHOR_BASE_PROMPT} Female politics correspondent in her late 30s, polished Washington newsroom style, navy blazer, realistic but fully fictional.`
  },
  national: {
    name: "Daniel Reyes",
    title: "National Affairs Reporter",
    initials: "DR",
    beat: "Public safety, courts and major U.S. stories",
    photoEligible: true,
    avatarPath: "authors/daniel-reyes.png",
    portraitPrompt: `${AUTHOR_BASE_PROMPT} Male national affairs reporter in his early 40s, warm expression, charcoal jacket, realistic but fully fictional.`
  },
  world: {
    name: "Nathan Brooks",
    title: "World News Correspondent",
    initials: "NB",
    beat: "Global events with U.S. impact",
    photoEligible: false
  },
  business: {
    name: "Marcus Hill",
    title: "Business and Economy Reporter",
    initials: "MH",
    beat: "Markets, companies and the American economy",
    photoEligible: true,
    avatarPath: "authors/marcus-hill.png",
    portraitPrompt: `${AUTHOR_BASE_PROMPT} Male business reporter in his mid 30s, simple blazer, newsroom headshot, realistic but fully fictional.`
  },
  technology: {
    name: "Sophie Carter",
    title: "Technology Reporter",
    initials: "SC",
    beat: "AI, platforms, cybersecurity and tech policy",
    photoEligible: false
  },
  climate: {
    name: "Hannah Moore",
    title: "Climate and Environment Reporter",
    initials: "HM",
    beat: "Extreme weather, energy and climate policy",
    photoEligible: false
  },
  health: {
    name: "Emily Parker",
    title: "Health and Science Reporter",
    initials: "EP",
    beat: "Medicine, public health and science",
    photoEligible: true,
    avatarPath: "authors/emily-parker.png",
    portraitPrompt: `${AUTHOR_BASE_PROMPT} Female health and science reporter in her early 30s, soft neutral blazer, realistic but fully fictional.`
  },
  sports: {
    name: "Jason Cole",
    title: "Sports Reporter",
    initials: "JC",
    beat: "Major leagues, athletes and American sports culture",
    photoEligible: false
  },
  style: {
    name: "Ava Mitchell",
    title: "Style and Culture Editor",
    initials: "AM",
    beat: "Culture, media, entertainment and American life",
    photoEligible: false
  },
  opinion: {
    name: "Editorial Board",
    title: "Opinion Desk",
    initials: "ED",
    beat: "Analysis and perspective",
    photoEligible: false
  }
};

export function getAuthorForCategory(category: string): AuthorProfile {
  return AUTHORS[category] || AUTHORS.national;
}

export function getPhotoEligibleAuthors() {
  return Object.values(AUTHORS).filter((author) => author.photoEligible && author.avatarPath && author.portraitPrompt);
}

export function getPublicAuthorAvatarUrl(author: AuthorProfile) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "news-images";
  if (!supabaseUrl || !author.avatarPath) return null;
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${author.avatarPath}`;
}
