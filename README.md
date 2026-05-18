# The American Desk — newsroom-style daily site

This build shifts the site toward a modern U.S. digital-news layout inspired by large American outlets:
- functional top navigation with category pages
- story detail pages
- stronger article structure (`title`, `dek`, `summary`, `body`, `category`, `subcategory`)
- automatic AI editorial image generation with Supabase Storage upload
- dynamic rendering to avoid oversized ISR deployment errors on Vercel

## Key setup steps

1. Import `supabase/schema.sql` in Supabase SQL Editor.
2. Create or keep a **public** storage bucket named `news-images`.
3. In Vercel, set:
   - `NEWS_API_KEY`
   - `OPENAI_API_KEY`
   - `GENERATE_IMAGES=true`
   - `CRON_SECRET`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_STORAGE_BUCKET=news-images`
4. Redeploy.
5. Test image generation:
   - `GET /api/debug/image` with `Authorization: Bearer YOUR_CRON_SECRET`
6. Test post generation:
   - `GET /api/cron/daily` with `Authorization: Bearer YOUR_CRON_SECRET`

## Important editorial note

The generator is instructed **not to fabricate facts**. Because feeds like NewsAPI often return only a title and short description, story bodies remain concise and cautious unless richer source text is available. If you want truly dense article pages like a major newsroom, add a fuller licensed feed or a trusted ingestion layer that captures more complete source summaries.

## Texas warehouse fire story

A manual featured story insert is included at the bottom of `supabase/schema.sql`. Replace the placeholder source URL with a verified article if you want to publish it as a factual live story.
