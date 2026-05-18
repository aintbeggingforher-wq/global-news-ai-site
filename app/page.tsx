import { getPosts } from "@/lib/db";

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
        <section className="hero">
          <div className="kicker">USA Daily News</div>
          <h1>America’s biggest stories, summarized fast.</h1>
          <p className="subtitle">
            A daily automated brief covering major U.S. headlines, short summaries, original sources, and clearly labeled AI illustrations.
          </p>
          <div className="meta-bar">
            <span className="pill">Updated daily</span>
            <span className="pill">U.S. headlines</span>
            <span className="pill">Sourced summaries</span>
            <span className="pill">AI illustrations</span>
          </div>
        </section>

        {posts.length === 0 ? (
          <div className="empty">
            No posts yet. Run the cron route:
            <br />
            <code>GET /api/cron/daily</code>
          </div>
        ) : (
          <section className="grid">
            {posts.map((post) => (
              <article className="card" key={post.id}>
                <div className="cover">
                  {post.image_url ? (
                    <img src={post.image_url} alt={`AI illustration for ${post.title}`} />
                  ) : (
                    <span className="cover-label">AI Illustration</span>
                  )}
                </div>
                <div className="card-body">
                  <div className="kicker">{post.region || "USA"} · {formatDate(post.published_at)}</div>
                  <h2>{post.title}</h2>
                  <p className="summary">{post.summary}</p>
                  <a className="source" href={post.source_url} target="_blank" rel="noreferrer">
                    Source: {post.source_name || "Read original story"}
                  </a>
                  <p className="ai-note">
                    Visual: editorial AI illustration, not presented as a real photo of the event.
                  </p>
                </div>
              </article>
            ))}
          </section>
        )}

        <footer className="footer">
          © {new Date().getFullYear()} USA Daily Brief — short summaries with links to original sources.
        </footer>
      </div>
    </main>
  );
}
