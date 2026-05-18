# The American Desk

A Washington Post-inspired modern digital newspaper layout for daily U.S. news. This is not a clone and does not use Washington Post branding.

## Sections

- Politics
- National
- World
- Business
- Technology
- Climate
- Health
- Style
- Opinion

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
