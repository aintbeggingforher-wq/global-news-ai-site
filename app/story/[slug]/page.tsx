import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostBySlug, getPostsByCategory } from "@/lib/db";
import { PRIMARY_NAV } from "@/lib/categories";
import { formatLongDate, formatShortDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function StoryImage({ src, alt }: { src?: string | null; alt: string }) {
  if (!src) return <div className="placeholder">Image pending</div>;
  return <img className="article-image" src={src} alt={alt} />;
}

export default async function StoryPage({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug);
  if (!post) notFound();
  const related = (await getPostsByCategory(post.category, 6)).filter((p) => p.slug !== post.slug).slice(0, 5);
  const paragraphs = post.body.split(/\n\n+/).filter(Boolean);

  return (
    <main className="page">
      <div className="shell">
        <div className="topbar">
          <span>{formatLongDate(post.published_at)}</span>
          <span>U.S. edition</span>
        </div>
        <div className="brandblock">
          <Link href="/" className="brand">The American Desk</Link>
          <div className="tagline">{post.category} / {post.subcategory}</div>
        </div>
        <nav className="nav">{PRIMARY_NAV.map((item) => <Link key={item.slug} href={`/${item.slug}`}>{item.label}</Link>)}</nav>

        <header className="article-header">
          <div className="kicker-row"><Link href={`/${post.category}`} className="pill">{post.category}</Link><span>{post.subcategory}</span><span>{formatShortDate(post.published_at)}</span></div>
          <h1>{post.title}</h1>
          <div className="article-dek">{post.dek}</div>
        </header>

        <section className="article-grid">
          <div>
            <StoryImage src={post.image_url} alt={post.image_alt || post.title} />
            <p className="note" style={{margin: '10px 0 18px'}}>Illustration note: AI-generated editorial visual created to accompany this story. It is not a documentary event photograph.</p>
            <article className="article-body">
              <div className="article-body-inner">
                {paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
                <p className="note">Original source: <a className="source-link" href={post.source_url} target="_blank" rel="noreferrer">{post.source_name}</a></p>
              </div>
            </article>
          </div>
          <aside className="sidebar">
            <div className="mini-list">
              <h3>Story details</h3>
              <p><strong>Published:</strong> {formatLongDate(post.published_at)}</p>
              <p><strong>Section:</strong> {post.category}</p>
              <p><strong>Subsection:</strong> {post.subcategory}</p>
            </div>
            <div className="mini-list">
              <h3>More in {post.category}</h3>
              {related.map((item) => (
                <Link key={item.id} href={`/story/${item.slug}`}>
                  <div className="section-kicker">{item.subcategory}</div>
                  <strong>{item.title}</strong>
                </Link>
              ))}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
