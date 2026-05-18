import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The American Desk",
  description: "Smart, sourced U.S. coverage — updated daily."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
