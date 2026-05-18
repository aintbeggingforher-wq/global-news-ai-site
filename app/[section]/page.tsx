import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostsByCategory } from "@/lib/db";
import { getSectionBySlug, PRIMARY_NAV } from "@/lib/categories";
import { formatLongDate, formatShortDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function StoryImage({ src, alt }: { src?: string | null; alt: string }) {
  if (!src) return <div className="placeholder">Image pending</div>;
  return <img src={src} alt={alt} />;
}

export default async function SectionPage({ params }: { params: { section: string } }) {
  const section = getSectionBySlug(params.section);
  if (!section) notFound();
  const posts = await getPostsByCategory(section.slug, 24);
  const lead = posts[0];
  const rest = posts.slice(1);

  return (
    <main className="page">
      <div className="shell">
        <div className="topbar">
          <span>{formatLongDate()}</span>
          <span>U.S. edition</span>
        </div>
        <div className="brandblock">
          <Link href="/" className="brand">The American Desk</Link>
          <div className="tagline">{section.label}</div>
        </div>
        <nav className="nav">{PRIMARY_NAV.map((item) => <Link key={item.slug} href={`/${item.slug}`}>{item.label}</Link>)}</nav>

        <section className="category-page-head">
          <div className="section-kicker">Section</div>
          <h1>{section.label}</h1>
          <p>{section.description}</p>
        </section>

        {lead && (
          <section className="hero">
            <article className="hero-main">
              <StoryImage src={lead.image_url} alt={lead.image_alt || lead.title} />
              <div className="copy">
                <div className="hero-meta">
                  <span>{lead.subcategory}</span>
                  <span>{formatShortDate(lead.published_at)}</span>
                </div>
                <Link href={`/story/${lead.slug}`}><h1>{lead.title}</h1></Link>
                <p>{lead.dek}</p>
              </div>
            </article>
            <aside className="hero-rail">
              <div className="section-title"><h2>Subsections</h2><span>{section.subcategories.join(" • ")}</span></div>
              {rest.slice(0, 4).map((post) => (
                <article className="rail-card" key={post.id}>
                  <div className="kicker-row"><span>{post.subcategory}</span><span>{formatShortDate(post.published_at)}</span></div>
                  <Link href={`/story/${post.slug}`}><h3>{post.title}</h3></Link>
                  <p>{post.summary}</p>
                </article>
              ))}
            </aside>
          </section>
        )}

        <section>
          <div className="section-title"><h2>Latest in {section.label}</h2><span>{posts.length} stories</span></div>
          <div className="latest-grid">
            {rest.map((post) => (
              <article key={post.id} className="story-card">
                <StoryImage src={post.image_url} alt={post.image_alt || post.title} />
                <div className="copy">
                  <div className="kicker-row"><span>{post.subcategory}</span><span>{formatShortDate(post.published_at)}</span></div>
                  <Link href={`/story/${post.slug}`}><h3>{post.title}</h3></Link>
                  <p>{post.dek}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
