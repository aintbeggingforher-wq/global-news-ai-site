import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "USA Daily Brief",
  description: "Daily U.S. news summarized with sourced AI-assisted briefs.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
