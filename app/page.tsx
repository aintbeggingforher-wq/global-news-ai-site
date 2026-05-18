import Link from "next/link";
import { getPosts } from "@/lib/db";
import { PRIMARY_NAV, postsBySection } from "@/lib/categories";
import { formatLongDate, formatShortDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function SiteHeader() {
  return (
    <>
      <div className="topbar">
        <span>{formatLongDate()}</span>
        <span>U.S. edition</span>
      </div>
      <div className="brandblock">
        <Link href="/" className="brand">The American Desk</Link>
        <div className="tagline">Sharp coverage of the day in America — with sourced reporting, quick context and clearly labeled AI editorial visuals.</div>
      </div>
      <nav className="nav" aria-label="Primary navigation">
        {PRIMARY_NAV.map((item) => (
          <Link key={item.slug} href={`/${item.slug}`}>{item.label}</Link>
        ))}
      </nav>
    </>
  );
}

function StoryImage({ src, alt }: { src?: string | null; alt: string }) {
  if (!src) return <div className="placeholder">Image pending</div>;
  return <img src={src} alt={alt} />;
}

export default async function HomePage() {
  const posts = await getPosts(30);
  const lead = posts[0];
  const latest = posts.slice(1, 7);
  const briefs = posts.slice(7, 11);
  const rightRail = posts.slice(11, 15);
  const sections = postsBySection(posts).filter((g) => g.posts.length > 0).slice(0, 6);

  return (
    <main className="page">
      <div className="shell">
        <SiteHeader />

        {posts.length === 0 ? (
          <section className="empty">
            <h1>No stories published yet.</h1>
            <p>Run <code>/api/cron/daily</code> after your environment variables are configured.</p>
          </section>
        ) : (
          <>
            <section className="hero">
              {lead && (
                <article className="hero-main">
                  <StoryImage src={lead.image_url} alt={lead.image_alt || lead.title} />
                  <div className="copy">
                    <div className="hero-meta">
                      <span className="section-kicker">{lead.category}</span>
                      <span>{formatShortDate(lead.published_at)}</span>
                    </div>
                    <Link href={`/story/${lead.slug}`}><h1>{lead.title}</h1></Link>
                    <p>{lead.dek}</p>
                    <div className="hero-meta">
                      <a className="source-link" href={lead.source_url} target="_blank" rel="noreferrer">Source: {lead.source_name}</a>
                      <span className="note">AI editorial illustration — not a real event photo.</span>
                    </div>
                  </div>
                </article>
              )}

              <aside className="hero-rail">
                <div className="section-title"><h2>What to know</h2><span>Editors’ picks</span></div>
                {rightRail.map((post) => (
                  <article key={post.id} className="rail-card">
                    <div className="kicker-row">
                      <span>{post.category}</span>
                      <span>{formatShortDate(post.published_at)}</span>
                    </div>
                    <Link href={`/story/${post.slug}`}><h3>{post.title}</h3></Link>
                    <p>{post.summary}</p>
                  </article>
                ))}
              </aside>
            </section>

            <section className="grid-2">
              <div>
                <div className="section-title"><h2>Latest</h2><span>Updated daily</span></div>
                <div className="latest-grid">
                  {latest.map((post) => (
                    <article key={post.id} className="story-card">
                      <StoryImage src={post.image_url} alt={post.image_alt || post.title} />
                      <div className="copy">
                        <div className="kicker-row">
                          <Link href={`/${post.category}`} className="pill">{post.category}</Link>
                          <span>{formatShortDate(post.published_at)}</span>
                        </div>
                        <Link href={`/story/${post.slug}`}><h3>{post.title}</h3></Link>
                        <p>{post.dek}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <div>
                <div className="section-title"><h2>News Briefs</h2><span>Fast context</span></div>
                <div className="briefs">
                  {briefs.map((post) => (
                    <article key={post.id} className="brief-card">
                      <div className="kicker-row">
                        <span>{post.subcategory}</span>
                        <span>{formatShortDate(post.published_at)}</span>
                      </div>
                      <Link href={`/story/${post.slug}`}><h3>{post.title}</h3></Link>
                      <p>{post.summary}</p>
                      <p className="note" style={{marginTop:12}}>Source: <a className="source-link" href={post.source_url} target="_blank" rel="noreferrer">{post.source_name}</a></p>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section>
              <div className="section-title"><h2>Sections</h2><span>Modeled after a modern U.S. newsroom layout</span></div>
              <div className="section-grid">
                {sections.map(({ section, posts }) => (
                  <Link key={section.slug} href={`/${section.slug}`} className="section-card">
                    <div className="section-kicker">{section.label}</div>
                    <strong>{posts[0]?.title}</strong>
                    <p>{section.description}</p>
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}

        <footer className="footer">
          The American Desk is a digital-news concept inspired by major U.S. news-site sectioning and navigation. Reporting snippets are sourced; AI visuals are clearly labeled as illustrative.
        </footer>
      </div>
    </main>
  );
}
