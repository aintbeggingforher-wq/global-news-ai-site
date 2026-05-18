import Link from "next/link";
import { getPostsByCategory } from "@/lib/db";
import { getSectionBySlug } from "@/lib/categories";
import { formatShortDate } from "@/lib/format";
import { SiteHeader } from "./SiteHeader";
import { StoryImage } from "./StoryImage";

export async function SectionTemplate({ slug }: { slug: string }) {
  const section = getSectionBySlug(slug);
  if (!section) return null;
  const allPosts = await getPostsByCategory(section.slug, 30);
  const posts = allPosts.filter((post) => post.image_url).length ? allPosts.filter((post) => post.image_url) : allPosts;
  const lead = posts[0];
  const rest = posts.slice(1);

  return (
    <main className="page">
      <div className="shell">
        <SiteHeader sectionLabel={section.label} />
        <section className="category-page-head">
          <div className="section-kicker">Section</div>
          <h1>{section.label}</h1>
          <p>{section.description}</p>
        </section>

        {posts.length === 0 ? (
          <section className="empty">
            <h2>No stories in this section yet.</h2>
            <p>As the daily update runs, stories matching this section will appear here.</p>
          </section>
        ) : (
          <>
            {lead && (
              <section className="hero">
                <article className="hero-main lead-feature">
                  <StoryImage src={lead.image_url} alt={lead.image_alt || lead.title} />
                  <div className="copy">
                    <div className="hero-meta"><span>{lead.subcategory}</span><span>{formatShortDate(lead.published_at)}</span></div>
                    <Link href={`/story/${lead.slug}`}><h1>{lead.title}</h1></Link>
                    <p>{lead.dek}</p>
                    <p className="note">By {lead.author_name} · {lead.reading_time} min read</p>
                  </div>
                </article>
                <aside className="hero-rail">
                  <div className="section-title"><h2>Subsections</h2><span>{section.subcategories.join(" • ")}</span></div>
                  {rest.slice(0, 4).map((post) => (
                    <article className="rail-card" key={post.id}>
                      <div className="kicker-row"><span>{post.subcategory}</span><span>{formatShortDate(post.published_at)}</span></div>
                      <Link href={`/story/${post.slug}`}><h3>{post.title}</h3></Link>
                      <p>{post.summary}</p>
                    </article>
                  ))}
                </aside>
              </section>
            )}
            <section>
              <div className="section-title"><h2>Latest in {section.label}</h2><span>{posts.length} stories</span></div>
              <div className="latest-grid">
                {rest.map((post) => (
                  <article key={post.id} className="story-card">
                    <StoryImage src={post.image_url} alt={post.image_alt || post.title} />
                    <div className="copy">
                      <div className="kicker-row"><span>{post.subcategory}</span><span>{formatShortDate(post.published_at)}</span></div>
                      <Link href={`/story/${post.slug}`}><h3>{post.title}</h3></Link>
                      <p>{post.dek}</p>
                      <p className="note">By {post.author_name}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
