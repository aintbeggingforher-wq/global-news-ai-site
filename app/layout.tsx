import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The American Desk",
  description: "A clean digital daily briefing for major U.S. stories, organized by politics, national news, world, business, tech, climate, health and culture.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
