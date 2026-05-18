import { getPosts } from "@/lib/db";

function formatDate(input?: string | null) {
  if (!input) return "Aujourd'hui";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
  }).format(new Date(input));
}

export default async function HomePage() {
  const posts = await getPosts();

  return (
    <main className="page">
      <div className="container">
        <section className="hero">
          <div className="kicker">Daily World News</div>
          <h1>Les news mondiales, résumées sans bruit.</h1>
          <p className="subtitle">
            Un brief quotidien automatisé : actualités importantes, résumé court, source originale et illustration IA clairement indiquée.
          </p>
          <div className="meta-bar">
            <span className="pill">Mise à jour quotidienne</span>
            <span className="pill">Résumés sourcés</span>
            <span className="pill">Illustrations IA</span>
          </div>
        </section>

        {posts.length === 0 ? (
          <div className="empty">
            Aucun post pour l’instant. Lance la route cron :
            <br />
            <code>GET /api/cron/daily</code>
          </div>
        ) : (
          <section className="grid">
            {posts.map((post) => (
              <article className="card" key={post.id}>
                <div className="cover">
                  {post.image_url ? (
                    <img src={post.image_url} alt={`Illustration IA pour ${post.title}`} />
                  ) : (
                    <span className="cover-label">Illustration IA</span>
                  )}
                </div>
                <div className="card-body">
                  <div className="kicker">{post.region || "Monde"} · {formatDate(post.published_at)}</div>
                  <h2>{post.title}</h2>
                  <p className="summary">{post.summary}</p>
                  <a className="source" href={post.source_url} target="_blank" rel="noreferrer">
                    Source : {post.source_name || "Lire l’article original"}
                  </a>
                  <p className="ai-note">
                    Visuel : illustration IA éditoriale, non présentée comme une vraie photo de l’événement.
                  </p>
                </div>
              </article>
            ))}
          </section>
        )}

        <footer className="footer">
          © {new Date().getFullYear()} Global Daily Brief — résumés courts et liens vers les sources originales.
        </footer>
      </div>
    </main>
  );
}
