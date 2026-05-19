import type { AuthorProfile } from "./types";
import { buildAuthorPortraitPrompt } from "./editorialPrompts";

export const AUTHORS: Record<string, AuthorProfile> = {
  politics: {
    name: "Olivia Bennett",
    title: "Politics Correspondent",
    initials: "OB",
    beat: "The White House, Congress and campaigns",
    photoEligible: true,
    avatarPath: "authors/olivia-bennett.png",
    portraitPrompt: buildAuthorPortraitPrompt({ name: "Olivia Bennett", title: "Politics Correspondent", beat: "The White House, Congress and campaigns" })
  },
  national: {
    name: "Daniel Reyes",
    title: "National Affairs Reporter",
    initials: "DR",
    beat: "Public safety, courts and major U.S. stories",
    photoEligible: true,
    avatarPath: "authors/daniel-reyes.png",
    portraitPrompt: buildAuthorPortraitPrompt({ name: "Daniel Reyes", title: "National Affairs Reporter", beat: "Public safety, courts and major U.S. stories" })
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
    portraitPrompt: buildAuthorPortraitPrompt({ name: "Marcus Hill", title: "Business and Economy Reporter", beat: "Markets, companies and the American economy" })
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
    portraitPrompt: buildAuthorPortraitPrompt({ name: "Emily Parker", title: "Health and Science Reporter", beat: "Medicine, public health and science" })
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
