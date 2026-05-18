export function formatLongDate(input?: string | null) {
  const date = input ? new Date(input) : new Date();
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

export function formatShortDate(input?: string | null) {
  const date = input ? new Date(input) : new Date();
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}
