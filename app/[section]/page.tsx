import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostsByCategory } from "@/lib/db";
import { getSectionBySlug, PRIMARY_NAV } from "@/lib/categories";
import { formatLongDate, formatShortDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function StoryImage({ src, alt }: { src?: string | null; alt: string }) {
  if (!src) return <div className="placeholder">Image pending</div>;
  return <img className="story-image" src={src} alt={alt} />;
}

export default async function SectionPage({ params }: { params: { section: string } }) {
  const section = getSectionBySlug(params.section);
  if (!section) notFound();
  const posts = await getPostsByCategory(section.slug, 32);
  const lead = posts[0];
  const rest = posts.slice(1);

  return <main className="page"><div className="shell">
    <div className="topbar"><span>{formatLongDate()}</span><span>U.S. Edition</span></div>
    <div className="brandblock"><Link href="/" className="brand">The American Desk</Link><div className="tagline">{section.label}</div></div>
    <nav className="nav">{PRIMARY_NAV.map((item) => <Link href={`/${item.slug}`} key={item.slug}>{item.label}</Link>)}</nav>
    <section className="category-head"><div className="section-kicker">Section</div><h1>{section.label}</h1><p>{section.description}</p></section>

    {posts.length === 0 ? <section className="empty"><h2>No stories in this section yet.</h2><p>New stories will appear here after the daily update.</p></section> : <>
      {lead && <section className="hero"><article className="hero-main"><StoryImage src={lead.image_url} alt={lead.image_alt || lead.title} /><div className="copy"><div className="meta"><span className="pill">{lead.subcategory}</span><span>{formatShortDate(lead.published_at)}</span><span>{lead.reading_time} min read</span></div><Link href={`/story/${lead.slug}`}><h1>{lead.title}</h1></Link><p>{lead.dek}</p><p className="note">By {lead.author_name}, {lead.author_title}</p></div></article><aside className="rail"><div className="section-title"><h2>Subsections</h2><span>{section.subcategories.join(" • ")}</span></div>{rest.slice(0, 4).map((post) => <article className="rail-card" key={post.id}><div className="kicker-row"><span>{post.subcategory}</span><span>{formatShortDate(post.published_at)}</span></div><Link href={`/story/${post.slug}`}><h3>{post.title}</h3></Link><p>{post.summary}</p></article>)}</aside></section>}
      <section><div className="section-title"><h2>Latest in {section.label}</h2><span>{posts.length} stories</span></div><div className="latest-grid">{rest.map((post) => <article className="story-card" key={post.id}><StoryImage src={post.image_url} alt={post.image_alt || post.title} /><div className="copy"><div className="kicker-row"><span>{post.subcategory}</span><span>{formatShortDate(post.published_at)}</span></div><Link href={`/story/${post.slug}`}><h3>{post.title}</h3></Link><p>{post.dek}</p><p className="note">By {post.author_name}</p></div></article>)}</div></section>
    </>}
    <footer className="footer">The American Desk — {section.label} coverage.</footer>
  </div></main>;
}
