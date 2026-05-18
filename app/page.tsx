import Link from "next/link";
import { getPosts } from "@/lib/db";
import { getAuthorForCategory } from "@/lib/authors";
import { PRIMARY_NAV, postsBySection } from "@/lib/categories";
import { formatLongDate, formatShortDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function Header() {
  return (
    <>
      <div className="topbar">
        <span>{formatLongDate()}</span>
        <span>U.S. Edition</span>
      </div>
      <div className="brandblock">
        <Link className="brand" href="/">The American Desk</Link>
        <div className="tagline">Sharp daily coverage across politics, national news, business, technology, health, sports and culture.</div>
      </div>
      <nav className="nav" aria-label="Primary navigation">
        {PRIMARY_NAV.map((item) => <Link href={`/${item.slug}`} key={item.slug}>{item.label}</Link>)}
      </nav>
    </>
  );
}

function StoryImage({ src, alt }: { src?: string | null; alt: string }) {
  if (!src) return <div className="placeholder"><span>Editorial image pending</span></div>;
  return <img className="story-image" src={src} alt={alt} />;
}

function Byline({ category, name, title, avatarUrl, note }: { category: string; name: string; title: string; avatarUrl?: string | null; note?: string | null }) {
  const author = getAuthorForCategory(category);
  return (
    <div className="author">
      {avatarUrl ? <img className="avatar avatar-img" src={avatarUrl} alt={`Editorial portrait for ${name}`} /> : <span className="avatar">{author.initials}</span>}
      <span>By <strong>{name}</strong><br /><small>{title}</small>{note ? <><br /><small className="avatar-note">{note}</small></> : null}</span>
    </div>
  );
}

export default async function HomePage() {
  const posts = await getPosts(48);
  const withImages = posts.filter((p) => p.image_url);
  const sorted = [...withImages, ...posts.filter((p) => !p.image_url)];
  const lead = sorted[0];
  const latest = sorted.slice(1, 7);
  const briefs = sorted.slice(7, 13);
  const rail = sorted.slice(13, 18);
  const sectionGroups = postsBySection(sorted).filter((g) => g.posts.length > 0).slice(0, 8);

  return (
    <main className="page">
      <div className="shell">
        <Header />
        {posts.length === 0 ? (
          <section className="empty">
            <h1>No stories published yet.</h1>
            <p>Run <code>/api/cron/daily</code> after your environment variables are configured.</p>
          </section>
        ) : (
          <>
            <section className="hero">
              {lead && <article className="hero-main">
                <StoryImage src={lead.image_url} alt={lead.image_alt || lead.title} />
                <div className="copy">
                  <div className="meta"><span className="pill">{lead.category}</span><span>{formatShortDate(lead.published_at)}</span><span>{lead.reading_time} min read</span></div>
                  <Link href={`/story/${lead.slug}`}><h1>{lead.title}</h1></Link>
                  <p>{lead.dek}</p>
                  <Byline category={lead.category} name={lead.author_name} title={lead.author_title} avatarUrl={lead.author_avatar_url} note={lead.author_photo_note} />
                  <p className="note">Photo illustration, not an actual event photograph. Source: <a className="source-link" href={lead.source_url} target="_blank" rel="noreferrer">{lead.source_name}</a></p>
                </div>
              </article>}
              <aside className="rail">
                <div className="section-title"><h2>What to know</h2><span>Editors’ picks</span></div>
                {rail.map((post) => <article className="rail-card" key={post.id}>
                  <div className="kicker-row"><span>{post.category}</span><span>{post.subcategory}</span></div>
                  <Link href={`/story/${post.slug}`}><h3>{post.title}</h3></Link>
                  <p>{post.summary}</p>
                  <p className="note">By {post.author_name} · {post.reading_time} min read</p>
                </article>)}
              </aside>
            </section>

            <section className="grid-2">
              <div>
                <div className="section-title"><h2>Latest</h2><span>Updated daily</span></div>
                <div className="latest-grid">
                  {latest.map((post) => <article className="story-card" key={post.id}>
                    <StoryImage src={post.image_url} alt={post.image_alt || post.title} />
                    <div className="copy">
                      <div className="kicker-row"><Link href={`/${post.category}`}>{post.category}</Link><span>{formatShortDate(post.published_at)}</span></div>
                      <Link href={`/story/${post.slug}`}><h3>{post.title}</h3></Link>
                      <p>{post.dek}</p>
                      <p className="note">By {post.author_name}</p>
                    </div>
                  </article>)}
                </div>
              </div>
              <div>
                <div className="section-title"><h2>News Briefs</h2><span>Fast context</span></div>
                <div className="briefs">
                  {briefs.map((post) => <article className="brief-card" key={post.id}>
                    <div className="kicker-row"><span>{post.subcategory}</span><span>{formatShortDate(post.published_at)}</span></div>
                    <Link href={`/story/${post.slug}`}><h3>{post.title}</h3></Link>
                    <p>{post.summary}</p>
                    <p className="note">By {post.author_name} · Source: <a className="source-link" href={post.source_url} target="_blank" rel="noreferrer">{post.source_name}</a></p>
                  </article>)}
                </div>
              </div>
            </section>

            <section>
              <div className="section-title"><h2>Sections</h2><span>Browse the newsroom</span></div>
              <div className="section-grid">
                {sectionGroups.map(({ section, posts }) => <Link className="section-card" href={`/${section.slug}`} key={section.slug}>
                  <div className="section-kicker">{section.label}</div>
                  <strong>{posts[0]?.title}</strong>
                  <p>{section.description}</p>
                </Link>)}
              </div>
            </section>
          </>
        )}
        <footer className="footer">The American Desk publishes sourced summaries with Photo illustrations. Images are illustrative and are not presented as real event photographs. Videos are embedded only when an official embeddable source URL is available.</footer>
      </div>
    </main>
  );
}
