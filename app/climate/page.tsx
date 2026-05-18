import Link from "next/link";
import { getPosts } from "@/lib/db";
import { categorizePost, getCategoryBySlug, PRIMARY_NAV } from "@/lib/categories";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SLUG = "climate";

function shortDate(input?: string | null) {
  if (!input) return "Today";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(input));
}

function ImageBlock({ post }: { post: any }) {
  if (!post.image_url) {
    return (
      <div className="image-placeholder">
        <span>Image pending</span>
      </div>
    );
  }

  return <img className="story-image" src={post.image_url} alt={`Editorial image for ${post.title}`} />;
}

export default async function CategoryPage() {
  const category = getCategoryBySlug(SLUG)!;
  const allPosts = await getPosts();
  const posts = allPosts.filter((post) => categorizePost(post).slug === SLUG);

  return (
    <main className="page">
      <div className="site-shell">
        <header className="top-header compact">
          <div className="date-line">U.S. Edition</div>
          <Link href="/" className="brand">The American Desk</Link>
          <div className="edition-line">Daily Briefing</div>
        </header>

        <nav className="nav-bar" aria-label="Primary navigation">
          {PRIMARY_NAV.map((item) => (
            <Link key={item.slug} href={`/${item.slug}`} className={item.slug === SLUG ? "active" : ""}>
              {item.label}
            </Link>
          ))}
        </nav>

        <section className="category-hero">
          <div className="category-badge static">{category.label}</div>
          <h1>{category.label}</h1>
          <p>{category.description}</p>
        </section>

        {posts.length === 0 ? (
          <section className="empty-state">
            <h2>No stories in this section yet.</h2>
            <p>As the daily update runs, stories matching this section will appear here.</p>
            <Link href="/" className="source-link">Back to front page</Link>
          </section>
        ) : (
          <section className="section-list">
            {posts.map((post) => (
              <article className="section-story" key={post.id}>
                <ImageBlock post={post} />
                <div>
                  <div className="story-label-row">
                    <span>{category.label}</span>
                    <span>{shortDate(post.published_at)}</span>
                  </div>
                  <h2>{post.title}</h2>
                  <p>{post.summary}</p>
                  <a className="source-link small" href={post.source_url} target="_blank" rel="noreferrer">
                    Original source: {post.source_name || "Source"}
                  </a>
                  <p className="visual-note">Image: AI-generated editorial visual, not an actual event photograph.</p>
                </div>
              </article>
            ))}
          </section>
        )}

        <footer className="footer">
          The American Desk publishes sourced summaries with AI-generated editorial visuals. Images are illustrative and are not presented as real event photographs.
        </footer>
      </div>
    </main>
  );
}
