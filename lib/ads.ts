export type SponsoredSlot = { brand: string; eyebrow: string; headline: string; body: string; cta: string };

export const sponsoredSlots: SponsoredSlot[] = [
  { brand: "Northline Travel", eyebrow: "Advertisement", headline: "A quieter way to plan the next weekend away", body: "City guides, hotel notes and quick travel ideas for busy readers.", cta: "Explore the guide" },
  { brand: "Cedar & Co.", eyebrow: "Advertisement", headline: "Simple tools for a sharper morning routine", body: "A curated note from our lifestyle partners.", cta: "Learn more" },
  { brand: "Harbor Card", eyebrow: "Sponsored", headline: "Track spending with fewer surprises", body: "A personal finance message for readers following the economy.", cta: "See options" },
];

export function getSponsoredSlot(index = 0) { return sponsoredSlots[index % sponsoredSlots.length]; }
export function shouldShowAd(index: number) { const enabled = process.env.ENABLE_AD_SLOTS !== "false"; const frequency = Number(process.env.AD_SLOT_FREQUENCY || 24); return enabled && index > 0 && index % frequency === 0; }
