# The American Daily

A classic American newspaper-style daily U.S. news site with sourced summaries and realistic editorial AI-generated visuals.

## Brand direction

- Public name: The American Daily
- Layout: traditional U.S. front-page newspaper
- Style: masthead, edition line, newspaper columns, lead story, top stories, latest dispatches
- Image style: highly realistic editorial AI-generated visuals
- Important: visuals are labeled as editorial AI-generated images, not actual event photographs

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

## Clean posts without images

```sql
delete from posts
where image_url is null
   or image_url = '';
```
