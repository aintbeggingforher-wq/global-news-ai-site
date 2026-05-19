create table if not exists posts (
  id text primary key,
  slug text unique,
  title text not null,
  dek text,
  summary text not null,
  body text,
  category text default 'national',
  subcategory text default 'General',
  region text default 'USA',
  author_name text default 'The American Desk Staff',
  author_title text default 'News Desk',
  author_avatar_url text,
  author_photo_note text,
  reading_time integer default 2,
  source_name text,
  source_url text not null,
  image_prompt text,
  image_url text,
  image_alt text,
  video_url text,
  video_embed_url text,
  video_source_name text,
  video_title text,
  is_featured boolean default false,
  published_at timestamptz,
  created_at timestamptz default now()
);

alter table posts add column if not exists slug text;
alter table posts add column if not exists dek text;
alter table posts add column if not exists body text;
alter table posts add column if not exists category text default 'national';
alter table posts add column if not exists subcategory text default 'General';
alter table posts add column if not exists author_name text default 'The American Desk Staff';
alter table posts add column if not exists author_title text default 'News Desk';
alter table posts add column if not exists author_avatar_url text;
alter table posts add column if not exists author_photo_note text;
alter table posts add column if not exists reading_time integer default 2;
alter table posts add column if not exists image_alt text;
alter table posts add column if not exists video_url text;
alter table posts add column if not exists video_embed_url text;
alter table posts add column if not exists video_source_name text;
alter table posts add column if not exists video_title text;
alter table posts add column if not exists is_featured boolean default false;

update posts
set
  slug = coalesce(slug, lower(regexp_replace(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g'), '(^-|-$)', '', 'g')) || '-' || substring(id, 1, 6)),
  dek = coalesce(dek, summary),
  body = coalesce(body, summary),
  category = coalesce(category, 'national'),
  subcategory = coalesce(subcategory, 'General'),
  author_name = coalesce(author_name, 'The American Desk Staff'),
  author_title = coalesce(author_title, 'News Desk'),
  reading_time = coalesce(reading_time, 2),
  image_alt = coalesce(image_alt, 'Editorial photo illustration for: ' || title),
  is_featured = coalesce(is_featured, false),
  author_photo_note = null;

create unique index if not exists posts_slug_unique_idx on posts (slug);
create index if not exists posts_published_at_idx on posts (published_at desc);
create index if not exists posts_category_idx on posts (category, published_at desc);
create index if not exists posts_featured_idx on posts (is_featured, published_at desc);

insert into posts (
  id, slug, title, dek, summary, body, category, subcategory, region,
  author_name, author_title, author_avatar_url, author_photo_note, reading_time,
  source_name, source_url, image_prompt, image_url, image_alt,
  video_url, video_embed_url, video_source_name, video_title, is_featured, published_at
)
values (
  'manual-texas-warehouse-fire-001',
  'texas-warehouse-fire-investigated-as-suspected-arson',
  'Texas Warehouse Fire Investigated as Suspected Arson',
  'Authorities say a major Texas warehouse blaze is being treated as a possible criminal fire while investigators work through the scene.',
  'A large Texas warehouse fire is under investigation as suspected arson after early indicators raised concerns that the blaze may have been intentionally set. Fire crews worked for hours to contain flames and heavy smoke while officials secured the surrounding area.',
  'A large warehouse fire in Texas is being investigated as a possible act of arson after authorities said early indicators at the scene raised concerns about a criminal cause. Officials have not announced a final determination, and investigators are continuing to review available evidence.\n\nFire crews spent hours battling flames and heavy smoke while emergency teams worked to secure the surrounding area. Officials said the first priority was to keep the fire from spreading, protect nearby properties and make the site safe enough for investigators to begin their work.\n\nInvestigators are expected to examine burn patterns, entry points, surveillance footage if available and witness accounts. Those details can help officials determine whether the fire started accidentally or was deliberately set.\n\nThe full extent of the damage has not been confirmed in the limited information available for this report. The case remains under investigation, and the source link should be replaced with a verified local report or official statement before this is treated as a fully sourced live article.',
  'national',
  'Public Safety',
  'USA',
  'Daniel Reyes',
  'National Affairs Reporter',
  'https://hiltoufaggrbfxvlwano.supabase.co/storage/v1/object/public/news-images/authors/daniel-reyes.png',
  null,
  3,
  'Local authorities / local news',
  'https://global-news-ai-site.vercel.app',
  'Ultra-realistic editorial photo illustration of a Texas warehouse fire from a safe news-camera distance: flames only coming from the industrial building roofline/loading bays, thick smoke, firefighters and emergency vehicles outside the fire perimeter, wet pavement, police tape, realistic smoke and light physics, no people inside flames, no giant fireball, no text or logos.',
  null,
  'Editorial photo illustration of firefighters responding from a safe distance to a warehouse fire in Texas.',
  null,
  null,
  null,
  null,
  true,
  now()
)
on conflict (id) do update set
  slug = excluded.slug,
  title = excluded.title,
  dek = excluded.dek,
  summary = excluded.summary,
  body = excluded.body,
  category = excluded.category,
  subcategory = excluded.subcategory,
  region = excluded.region,
  author_name = excluded.author_name,
  author_title = excluded.author_title,
  author_avatar_url = excluded.author_avatar_url,
  author_photo_note = null,
  reading_time = excluded.reading_time,
  source_name = excluded.source_name,
  source_url = excluded.source_url,
  image_prompt = excluded.image_prompt,
  image_url = excluded.image_url,
  image_alt = excluded.image_alt,
  video_url = excluded.video_url,
  video_embed_url = excluded.video_embed_url,
  video_source_name = excluded.video_source_name,
  video_title = excluded.video_title,
  is_featured = excluded.is_featured,
  published_at = excluded.published_at;
