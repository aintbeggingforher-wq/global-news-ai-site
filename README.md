# USA Daily Brief + Automatic AI Images

Automated website for daily U.S. news briefs with short summaries, original sources, and daily AI-generated editorial images that are uploaded automatically to Supabase Storage.

## What it does

- `GET /api/cron/daily` fetches U.S.-focused news.
- The system stores posts in Supabase.
- The homepage displays the latest U.S. news.
- If OpenAI is connected, summaries are rewritten in natural American English.
- If `GENERATE_IMAGES=true`, the cron generates one AI image per post.
- Generated images are uploaded automatically to the public Supabase Storage bucket.
- AI images are treated as editorial illustrations, not real event photos.

## Required setup

### 1) Supabase table
Run the SQL in `supabase/schema.sql`.

### 2) Supabase Storage bucket
Create a public bucket named:

```bash
news-images
```

### 3) Environment variables

```bash
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=news-images
CRON_SECRET=

NEWS_API_KEY=

OPENAI_API_KEY=
OPENAI_TEXT_MODEL=gpt-4o-mini
OPENAI_IMAGE_MODEL=gpt-image-1
GENERATE_IMAGES=true
```

## Test the cron

```bash
curl -X GET https://your-site.vercel.app/api/cron/daily   -H "Authorization: Bearer YOUR_CRON_SECRET"
```

If everything is configured correctly, each daily run will create posts and attach matching AI illustrations automatically.
