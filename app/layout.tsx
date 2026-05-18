import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Global Daily Brief",
  description: "Daily world news summarized with sourced AI-assisted briefs.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
