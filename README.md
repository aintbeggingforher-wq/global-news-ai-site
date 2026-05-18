# USA Daily Brief

Automated website for daily U.S. news briefs with short summaries, original sources, AI image prompts, and optional AI image generation.

## What it does

- `GET /api/cron/daily` fetches U.S.-focused news.
- The system stores posts in Supabase.
- The homepage displays the latest U.S. news.
- If OpenAI is connected, summaries are rewritten in natural American English.
- AI images are treated as editorial illustrations, not real event photos.

## Environment variables

```bash
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=

NEWS_API_KEY=

OPENAI_API_KEY=
OPENAI_TEXT_MODEL=gpt-4o-mini
OPENAI_IMAGE_MODEL=gpt-image-1
GENERATE_IMAGES=false
```

## Supabase

Run the SQL in `supabase/schema.sql`.

## Test the cron

```bash
curl -X GET https://your-site.vercel.app/api/cron/daily \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```
