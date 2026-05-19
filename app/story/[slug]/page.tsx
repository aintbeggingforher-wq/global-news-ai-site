import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostBySlug, getPostsByCategory } from "@/lib/db";
import { getAuthorForCategory } from "@/lib/authors";
import { PRIMARY_NAV } from "@/lib/categories";
import { formatLongDate, formatShortDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StoryPage({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug);
  if (!post) notFound();
  const author = getAuthorForCategory(post.category);
  const related = (await getPostsByCategory(post.category, 7)).filter((p) => p.slug !== post.slug).slice(0, 5);
  const paragraphs = post.body.split(/\n\n+/).filter(Boolean);

  return <main className="page"><div className="shell">
    <div className="topbar"><span>{formatLongDate(post.published_at)}</span><span>U.S. Edition</span></div>
    <div className="brandblock"><Link className="brand" href="/">The American Desk</Link><div className="tagline">{post.category} / {post.subcategory}</div></div>
    <nav className="nav">{PRIMARY_NAV.map((item) => <Link href={`/${item.slug}`} key={item.slug}>{item.label}</Link>)}</nav>
    <header className="article-header"><div className="meta"><Link className="pill" href={`/${post.category}`}>{post.category}</Link><span>{post.subcategory}</span><span>{formatShortDate(post.published_at)}</span><span>{post.reading_time} min read</span></div><h1>{post.title}</h1><div className="article-dek">{post.dek}</div><div className="author" style={{marginTop:16}}>{post.author_avatar_url ? <img className="avatar avatar-img" src={post.author_avatar_url} alt={`Editorial portrait for ${post.author_name}`} /> : <span className="avatar">{author.initials}</span>}<span>By <strong>{post.author_name}</strong><br /><small>{post.author_title}</small></span></div></header>
    <section className="article-grid"><div>
      {post.image_url ? <img className="article-image" src={post.image_url} alt={post.image_alt || post.title} /> : <div className="placeholder"><span>Editorial image pending</span></div>}
      <p className="note">Image: Editorial photo illustration.</p>
      {post.video_embed_url && <div className="video-box"><iframe src={post.video_embed_url} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={post.video_title || post.title}></iframe><div className="video-caption">Video source: {post.video_source_name || post.source_name}. Embedded from original source when available.</div></div>}
      <article className="article-body">{paragraphs.map((p, i) => <p key={i}>{p}</p>)}<p className="note">Original source: <a className="source-link" href={post.source_url} target="_blank" rel="noreferrer">{post.source_name}</a></p></article>
    </div><aside className="sidebar"><div className="mini-list"><h3>Reporter</h3><div className="author">{post.author_avatar_url ? <img className="avatar avatar-img" src={post.author_avatar_url} alt={`Editorial portrait for ${post.author_name}`} /> : <span className="avatar">{author.initials}</span>}<span><strong>{post.author_name}</strong><br /><small>{post.author_title}</small></span></div><p className="note">Beat: {author.beat}</p></div><div className="mini-list"><h3>More in {post.category}</h3>{related.map((item) => <Link href={`/story/${item.slug}`} key={item.id}><div className="section-kicker">{item.subcategory}</div><strong>{item.title}</strong></Link>)}</div></aside></section>
  </div></main>;
}
