create table if not exists posts (
  id text primary key,
  title text not null,
  summary text not null,
  region text default 'Monde',
  source_name text,
  source_url text not null,
  image_prompt text,
  image_url text,
  published_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists posts_published_at_idx on posts (published_at desc);
