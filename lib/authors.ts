import type { AuthorProfile } from "./types";

export const AUTHORS: Record<string, AuthorProfile> = {
  politics: {
    name: "Olivia Bennett",
    title: "Senior Politics Correspondent",
    initials: "OB",
    beat: "White House, Congress and national campaigns"
  },
  national: {
    name: "Daniel Reyes",
    title: "National Affairs Reporter",
    initials: "DR",
    beat: "Public safety, courts and major U.S. stories"
  },
  world: {
    name: "Nathan Brooks",
    title: "World News Correspondent",
    initials: "NB",
    beat: "Global events with U.S. impact"
  },
  business: {
    name: "Marcus Hill",
    title: "Business and Economy Reporter",
    initials: "MH",
    beat: "Markets, companies and the American economy"
  },
  technology: {
    name: "Sophie Carter",
    title: "Technology Reporter",
    initials: "SC",
    beat: "AI, platforms, cybersecurity and tech policy"
  },
  climate: {
    name: "Hannah Moore",
    title: "Climate and Environment Reporter",
    initials: "HM",
    beat: "Extreme weather, energy and climate policy"
  },
  health: {
    name: "Emily Parker",
    title: "Health and Science Reporter",
    initials: "EP",
    beat: "Medicine, public health and science"
  },
  sports: {
    name: "Jason Cole",
    title: "Sports Reporter",
    initials: "JC",
    beat: "Major leagues, athletes and American sports culture"
  },
  style: {
    name: "Ava Mitchell",
    title: "Style and Culture Editor",
    initials: "AM",
    beat: "Culture, media, entertainment and American life"
  },
  opinion: {
    name: "Editorial Board",
    title: "Opinion Desk",
    initials: "ED",
    beat: "Analysis and perspective"
  }
};

export function getAuthorForCategory(category: string): AuthorProfile {
  return AUTHORS[category] || AUTHORS.national;
}
