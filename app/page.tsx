import Link from "next/link";
import { getPosts } from "@/lib/db";
import { categorizePost, getFeaturedByCategory, PRIMARY_NAV } from "@/lib/categories";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatDate(input?: string | null) {
  if (!input) return "Today";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(input));
}

function shortDate(input?: string | null) {
  if (!input) return "Today";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(input));
}

function ImageBlock({ post, priority = false }: { post: any; priority?: boolean }) {
  if (!post.image_url) {
    return (
      <div className="image-placeholder">
        <span>Image pending</span>
      </div>
    );
  }

  return <img className="story-image" src={post.image_url} alt={`Editorial image for ${post.title}`} loading={priority ? "eager" : "lazy"} />;
}

function CategoryBadge({ post }: { post: any }) {
  const category = categorizePost(post);
  return (
    <Link className="category-badge" href={`/${category.slug}`}>
      {category.label}
    </Link>
  );
}

export default async function HomePage() {
  const posts = await getPosts();
  const lead = posts[0];
  const rightRail = posts.slice(1, 4);
  const latest = posts.slice(4, 10);
  const byCategory = getFeaturedByCategory(posts).filter((group) => group.posts.length > 0).slice(0, 6);

  return (
    <main className="page">
      <div className="site-shell">
        <header className="top-header">
          <div className="date-line">{formatDate(new Date().toISOString())}</div>
          <Link href="/" className="brand">The American Desk</Link>
          <div className="edition-line">U.S. Edition</div>
        </header>

        <nav className="nav-bar" aria-label="Primary navigation">
          {PRIMARY_NAV.map((category) => (
            <Link key={category.slug} href={`/${category.slug}`}>
              {category.label}
            </Link>
          ))}
        </nav>

        {posts.length === 0 ? (
          <section className="empty-state">
            <h1>No stories published yet.</h1>
            <p>Run the daily update route to publish today’s edition.</p>
            <code>GET /api/cron/daily</code>
          </section>
        ) : (
          <>
            <section className="lead-grid">
              {lead && (
                <article className="lead-card">
                  <ImageBlock post={lead} priority />
                  <div className="story-label-row">
                    <CategoryBadge post={lead} />
                    <span>{shortDate(lead.published_at)}</span>
                  </div>
                  <h1>{lead.title}</h1>
                  <p>{lead.summary}</p>
                  <a className="source-link" href={lead.source_url} target="_blank" rel="noreferrer">
                    Original source: {lead.source_name || "Source"}
                  </a>
                  <p className="visual-note">Image: AI-generated editorial visual, not an actual event photograph.</p>
                </article>
              )}

              <aside className="rail-card">
                <div className="section-title">What to know</div>
                {rightRail.map((post) => (
                  <article className="rail-story" key={post.id}>
                    <CategoryBadge post={post} />
                    <h2>{post.title}</h2>
                    <p>{post.summary}</p>
                    <a className="source-link small" href={post.source_url} target="_blank" rel="noreferrer">
                      {post.source_name || "Source"}
                    </a>
                  </article>
                ))}
              </aside>
            </section>

            <section className="latest-section">
              <div className="section-heading">
                <h2>Latest</h2>
                <span>Updated daily</span>
              </div>

              <div className="latest-grid">
                {latest.map((post) => (
                  <article className="story-card" key={post.id}>
                    <ImageBlock post={post} />
                    <div className="story-label-row">
                      <CategoryBadge post={post} />
                      <span>{shortDate(post.published_at)}</span>
                    </div>
                    <h3>{post.title}</h3>
                    <p>{post.summary}</p>
                    <a className="source-link small" href={post.source_url} target="_blank" rel="noreferrer">
                      Original source: {post.source_name || "Source"}
                    </a>
                  </article>
                ))}
              </div>
            </section>

            <section className="category-section">
              <div className="section-heading">
                <h2>Sections</h2>
                <span>Browse by category</span>
              </div>

              <div className="category-grid">
                {byCategory.map(({ category, posts }) => (
                  <Link className="category-tile" href={`/${category.slug}`} key={category.slug}>
                    <span>{category.label}</span>
                    <strong>{posts[0]?.title}</strong>
                    <small>{category.description}</small>
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}

        <footer className="footer">
          The American Desk publishes sourced summaries with AI-generated editorial visuals. Images are illustrative and are not presented as real event photographs.
        </footer>
      </div>
    </main>
  );
}
