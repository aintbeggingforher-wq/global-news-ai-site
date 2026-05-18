import Link from "next/link";
import { getDisplayPosts } from "@/lib/db";
import { postsBySection } from "@/lib/categories";
import { formatShortDate } from "@/lib/format";
import { SiteHeader } from "@/components/SiteHeader";
import { StoryImage } from "@/components/StoryImage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const posts = await getDisplayPosts(30);
  const lead = posts[0];
  const latest = posts.slice(1, 7);
  const briefs = posts.slice(7, 11);
  const rail = posts.slice(11, 15);
  const sections = postsBySection(posts).filter((group) => group.posts.length > 0).slice(0, 6);

  return (
    <main className="page">
      <div className="shell">
        <SiteHeader />
        {posts.length === 0 ? (
          <section className="empty">
            <h1>No stories published yet.</h1>
            <p>Run <code>/api/cron/daily</code> after your Vercel environment variables are configured.</p>
          </section>
        ) : (
          <>
            <section className="hero">
              {lead && (
                <article className="hero-main">
                  <StoryImage src={lead.image_url} alt={lead.image_alt || lead.title} />
                  <div className="copy">
                    <div className="hero-meta"><span className="section-kicker">{lead.category}</span><span>{formatShortDate(lead.published_at)}</span></div>
                    <Link href={`/story/${lead.slug}`}><h1>{lead.title}</h1></Link>
                    <p>{lead.dek}</p>
                    <div className="hero-meta"><span>By {lead.author_name}</span><span>{lead.reading_time} min read</span></div>
                    <p className="note">Image: AI-generated editorial visual, not an actual event photograph.</p>
                  </div>
                </article>
              )}
              <aside className="hero-rail">
                <div className="section-title"><h2>What to know</h2><span>Daily briefing</span></div>
                {rail.map((post) => (
                  <article key={post.id} className="rail-card">
                    <div className="kicker-row"><span>{post.subcategory}</span><span>{formatShortDate(post.published_at)}</span></div>
                    <Link href={`/story/${post.slug}`}><h3>{post.title}</h3></Link>
                    <p>{post.summary}</p>
                    <p className="note">By {post.author_name}</p>
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
                        <div className="kicker-row"><Link href={`/${post.category}`} className="pill">{post.category}</Link><span>{formatShortDate(post.published_at)}</span></div>
                        <Link href={`/story/${post.slug}`}><h3>{post.title}</h3></Link>
                        <p>{post.dek}</p>
                        <p className="note">By {post.author_name} · {post.reading_time} min read</p>
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
                      <div className="kicker-row"><span>{post.subcategory}</span><span>{formatShortDate(post.published_at)}</span></div>
                      <Link href={`/story/${post.slug}`}><h3>{post.title}</h3></Link>
                      <p>{post.summary}</p>
                      <p className="note">Source: <a className="source-link" href={post.source_url} target="_blank" rel="noreferrer">{post.source_name}</a></p>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section>
              <div className="section-title"><h2>Sections</h2><span>Browse by newsroom desk</span></div>
              <div className="section-grid">
                {sections.map(({ section, posts }) => (
                  <Link href={`/${section.slug}`} className="section-card" key={section.slug}>
                    <div className="section-kicker">{section.label}</div>
                    <strong>{posts[0]?.title}</strong>
                    <p>{section.description}</p>
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}
        <footer className="footer">The American Desk publishes sourced summaries with clearly labeled AI-generated editorial visuals. Images are illustrative and are not presented as real event photographs.</footer>
      </div>
    </main>
  );
}
