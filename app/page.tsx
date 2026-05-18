import { getPosts } from "@/lib/db";

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
    year: "numeric",
  }).format(new Date(input));
}

function StoryImage({ post, large = false }: { post: any; large?: boolean }) {
  if (!post.image_url) {
    return (
      <div className={large ? "missing-photo missing-photo-large" : "missing-photo"}>
        <span>Photo Pending</span>
      </div>
    );
  }

  return (
    <img
      src={post.image_url}
      alt={`Editorial image for ${post.title}`}
      className={large ? "story-photo story-photo-large" : "story-photo"}
    />
  );
}

export default async function HomePage() {
  const posts = await getPosts();
  const lead = posts[0];
  const sideStories = posts.slice(1, 3);
  const latest = posts.slice(3, 12);

  return (
    <main className="page">
      <div className="paper">
        <header className="topline">
          <span>U.S. Edition</span>
          <span>Independent Daily Briefing</span>
          <span>{formatDate(new Date().toISOString())}</span>
        </header>

        <section className="masthead">
          <div className="masthead-rule" />
          <h1>The American Daily</h1>
          <p>Major U.S. stories, reported with clarity and context.</p>
          <div className="masthead-rule" />
        </section>

        <nav className="navline">
          <span>Politics</span>
          <span>Business</span>
          <span>Public Safety</span>
          <span>Culture</span>
          <span>Technology</span>
          <span>National</span>
        </nav>

        {posts.length === 0 ? (
          <section className="empty">
            <h2>No stories published yet.</h2>
            <p>Run the daily update route to publish today’s edition.</p>
            <code>GET /api/cron/daily</code>
          </section>
        ) : (
          <>
            <section className="front-page">
              {lead && (
                <article className="lead-story">
                  <StoryImage post={lead} large />
                  <div className="story-meta">{lead.region || "USA"} · {shortDate(lead.published_at)}</div>
                  <h2>{lead.title}</h2>
                  <p className="lead-summary">{lead.summary}</p>
                  <a className="source" href={lead.source_url} target="_blank" rel="noreferrer">
                    Original reporting: {lead.source_name || "Source"}
                  </a>
                  <p className="visual-note">Editorial AI-generated image, not an actual event photograph.</p>
                </article>
              )}

              <aside className="side-column">
                <div className="section-label">Top Stories</div>
                {sideStories.map((post) => (
                  <article className="side-story" key={post.id}>
                    <StoryImage post={post} />
                    <div className="story-meta">{post.region || "USA"} · {shortDate(post.published_at)}</div>
                    <h3>{post.title}</h3>
                    <p>{post.summary}</p>
                    <a className="source small" href={post.source_url} target="_blank" rel="noreferrer">
                      {post.source_name || "Source"}
                    </a>
                  </article>
                ))}
              </aside>
            </section>

            {latest.length > 0 && (
              <section className="latest-section">
                <div className="section-header">
                  <span>Latest Dispatches</span>
                  <span>Updated Daily</span>
                </div>

                <div className="latest-grid">
                  {latest.map((post) => (
                    <article className="latest-card" key={post.id}>
                      <StoryImage post={post} />
                      <div className="story-meta">{post.region || "USA"} · {shortDate(post.published_at)}</div>
                      <h3>{post.title}</h3>
                      <p>{post.summary}</p>
                      <a className="source small" href={post.source_url} target="_blank" rel="noreferrer">
                        Original source: {post.source_name || "Source"}
                      </a>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        <footer className="footer">
          The American Daily publishes sourced summaries with editorial AI-generated visuals. Images are illustrative and are not presented as actual event photographs.
        </footer>
      </div>
    </main>
  );
}
