export type Author = {
  name: string;
  title: string;
  categories: string[];
};

export const AUTHORS: Author[] = [
  { name: "Clara Whitman", title: "Senior Politics Reporter", categories: ["politics", "opinion"] },
  { name: "Daniel Reyes", title: "National Affairs Reporter", categories: ["national"] },
  { name: "Maya Chen", title: "World Desk Correspondent", categories: ["world"] },
  { name: "Evelyn Carter", title: "Business Reporter", categories: ["business"] },
  { name: "Nora Patel", title: "Technology Reporter", categories: ["technology"] },
  { name: "Grace Miller", title: "Climate & Weather Reporter", categories: ["climate"] },
  { name: "Sophia Bennett", title: "Health Reporter", categories: ["health"] },
  { name: "Olivia Brooks", title: "Style & Culture Reporter", categories: ["style"] }
];

export function getAuthorForCategory(category: string) {
  return AUTHORS.find((author) => author.categories.includes(category)) || AUTHORS[1];
}
