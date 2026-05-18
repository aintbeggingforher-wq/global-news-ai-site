import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostBySlug, getPostsByCategory } from "@/lib/db";
import { SiteHeader } from "@/components/SiteHeader";
import { StoryImage } from "@/components/StoryImage";
import { formatLongDate, formatShortDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StoryPage({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug);
  if (!post) notFound();
  const related = (await getPostsByCategory(post.category, 8)).filter((item) => item.slug !== post.slug).slice(0, 5);
  const paragraphs = post.body.split(/\n\n+/).filter(Boolean);

  return (
    <main className="page">
      <div className="shell">
        <SiteHeader sectionLabel={`${post.category} / ${post.subcategory}`} />
        <header className="article-header">
          <div className="kicker-row"><Link href={`/${post.category}`} className="pill">{post.category}</Link><span>{post.subcategory}</span><span>{formatShortDate(post.published_at)}</span></div>
          <h1>{post.title}</h1>
          <div className="article-dek">{post.dek}</div>
          <div className="byline">By <strong>{post.author_name}</strong>, {post.author_title}<br />Published {formatLongDate(post.published_at)} · {post.reading_time} min read</div>
        </header>
        <section className="article-grid">
          <div>
            <StoryImage src={post.image_url} alt={post.image_alt || post.title} className="article-image" />
            <p className="note">Illustration note: AI-generated editorial visual created to accompany this story. It is not a documentary event photograph.</p>
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
              <p><strong>Desk:</strong> {post.category}</p>
              <p><strong>Beat:</strong> {post.subcategory}</p>
              <p><strong>Reporter:</strong> {post.author_name}</p>
              <p><strong>Source:</strong> <a className="source-link" href={post.source_url} target="_blank" rel="noreferrer">{post.source_name}</a></p>
            </div>
            <div className="mini-list">
              <h3>More in {post.category}</h3>
              {related.map((item) => <Link key={item.id} href={`/story/${item.slug}`}><span className="section-kicker">{item.subcategory}</span><strong>{item.title}</strong></Link>)}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
