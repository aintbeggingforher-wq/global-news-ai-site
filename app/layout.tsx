import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Daily Edit",
  description: "A soft daily edit of the biggest U.S. stories, summarized clearly with original sources.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
