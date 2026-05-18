import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The American Daily",
  description: "A classic American-style daily newspaper covering major U.S. stories with sourced summaries and editorial images.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
