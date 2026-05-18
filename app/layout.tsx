import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: process.env.SITE_NAME || "The American Desk",
  description: process.env.SITE_TAGLINE || "Sharp coverage of the day in America"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
