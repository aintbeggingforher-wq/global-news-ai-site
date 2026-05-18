import { getPosts } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatDate(input?: string | null) {
  if (!input) return "Today";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(input));
}

export default async function HomePage() {
  const posts = await getPosts();

  return (
    <main className="page">
      <div className="container">
        <header className="site-header">
          <div className="brand-mark">TDE</div>
          <div>
            <div className="brand-name">The Daily Edit</div>
            <div className="brand-subtitle">Smart news, softer delivery.</div>
          </div>
        </header>

        <section className="hero">
          <div className="kicker">Daily U.S. News</div>
          <h1>America’s biggest stories, edited for real life.</h1>
          <p className="subtitle">
            A calm, clear daily brief covering major U.S. headlines, quick context, original sources, and editorial visuals that make the story easier to understand.
          </p>
          <div className="meta-bar">
            <span className="pill">Updated daily</span>
            <span className="pill">Easy to read</span>
            <span className="pill">Sourced summaries</span>
            <span className="pill">Editorial visuals</span>
          </div>
        </section>

        {posts.length === 0 ? (
          <div className="empty">
            No stories yet. Run the daily update:
            <br />
            <code>GET /api/cron/daily</code>
          </div>
        ) : (
          <section className="grid">
            {posts.map((post) => (
              <article className="card" key={post.id}>
                <div className="cover">
                  {post.image_url ? (
                    <img src={post.image_url} alt={`Editorial visual for ${post.title}`} />
                  ) : (
                    <span className="cover-label">Editorial Visual</span>
                  )}
                </div>
                <div className="card-body">
                  <div className="kicker">{post.region || "USA"} · {formatDate(post.published_at)}</div>
                  <h2>{post.title}</h2>
                  <p className="summary">{post.summary}</p>
                  <a className="source" href={post.source_url} target="_blank" rel="noreferrer">
                    Read the original source: {post.source_name || "Source"}
                  </a>
                  <p className="ai-note">
                    Visual note: editorial AI-assisted illustration, not a real event photo.
                  </p>
                </div>
              </article>
            ))}
          </section>
        )}

        <footer className="footer">
          © {new Date().getFullYear()} The Daily Edit — simple summaries with links to original reporting.
        </footer>
      </div>
    </main>
  );
}
