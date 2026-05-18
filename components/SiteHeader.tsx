import Link from "next/link";
import { PRIMARY_NAV } from "@/lib/categories";
import { formatLongDate } from "@/lib/format";

export function SiteHeader({ sectionLabel }: { sectionLabel?: string }) {
  return (
    <>
      <div className="topbar">
        <span>{formatLongDate()}</span>
        <span>U.S. edition</span>
      </div>
      <div className="brandblock">
        <Link href="/" className="brand">The American Desk</Link>
        <div className="tagline">{sectionLabel || "Smart, sourced U.S. coverage — updated daily."}</div>
      </div>
      <nav className="nav" aria-label="Primary navigation">
        {PRIMARY_NAV.map((item) => <Link key={item.slug} href={`/${item.slug}`}>{item.label}</Link>)}
      </nav>
    </>
  );
}
