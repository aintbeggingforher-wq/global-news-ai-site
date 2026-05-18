# The Daily Edit

A softer daily U.S. news website with sourced summaries and editorial AI-assisted visuals.

## Brand direction

- Public name: The Daily Edit
- Tone: calm, clear, modern, female-friendly, lifestyle editorial
- Visual style: warm cream background, soft blush accents, rounded cards, readable summaries

## Required environment variables

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

## Test image generation

```bash
curl -X GET https://your-site.vercel.app/api/debug/image \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Run daily cron

```bash
curl -X GET https://your-site.vercel.app/api/cron/daily \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```
