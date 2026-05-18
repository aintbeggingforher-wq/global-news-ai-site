create table if not exists posts (
  id text primary key,
  slug text unique not null,
  title text not null,
  dek text not null,
  summary text not null,
  body text not null,
  category text not null default 'national',
  subcategory text not null default 'General',
  region text default 'USA',
  source_name text,
  source_url text not null,
  image_prompt text,
  image_url text,
  image_alt text,
  published_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists posts_published_at_idx on posts (published_at desc);
create index if not exists posts_category_idx on posts (category, published_at desc);
create index if not exists posts_slug_idx on posts (slug);

-- Optional demo / manual featured story.
insert into posts (
  id, slug, title, dek, summary, body, category, subcategory, region,
  source_name, source_url, image_prompt, image_url, image_alt, published_at
)
values (
  'manual-texas-warehouse-fire-001',
  'texas-warehouse-fire-investigated-as-suspected-arson',
  'Texas Warehouse Fire Investigated as Suspected Arson',
  'Authorities in Texas say a major warehouse blaze is being treated as a possible criminal fire as investigators work through the scene.',
  'A large warehouse fire in Texas is under investigation after authorities said early indicators suggested the blaze may have been intentionally set. Firefighters spent hours battling flames and heavy smoke while officials moved to secure the surrounding area and keep the fire from spreading.',
  'A major warehouse fire in Texas is being investigated as a possible act of arson after authorities said early signs at the scene raised concerns about a criminal cause. Officials have not yet released a final determination, but investigators are reviewing physical evidence, witness accounts and damage patterns as the inquiry moves forward.\n\nFire crews spent hours fighting the blaze as thick smoke rose over the property and emergency teams worked to contain hot spots. Authorities said their immediate priority was protecting nearby structures, securing the perimeter and making sure the area was safe for investigators and utility crews.\n\nThe full extent of the damage was not immediately clear, and no additional verified details were available at publication time. If you publish this demo story live, replace the placeholder source link with a verified reporting source.',
  'national',
  'Public Safety',
  'USA',
  'Manual entry',
  'https://example.com/replace-with-real-source',
  'Create a highly realistic AI-generated editorial illustration of firefighters responding to a large warehouse fire at night in Texas. Show flames and smoke engulfing an industrial building, emergency lights reflecting on wet pavement, firefighters in the foreground, realistic urban-industrial surroundings, cinematic but believable photojournalism style, clearly illustrative and not a real event photograph, no logos, no text overlays.',
  null,
  'AI-generated editorial illustration of firefighters responding to a warehouse fire in Texas.',
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
  source_name = excluded.source_name,
  source_url = excluded.source_url,
  image_prompt = excluded.image_prompt,
  image_alt = excluded.image_alt,
  published_at = excluded.published_at;
