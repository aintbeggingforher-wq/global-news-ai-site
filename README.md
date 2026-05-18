# USA Daily Brief + Automatic AI Images + Debug

Automated website for daily U.S. news briefs with short summaries, original sources, and daily AI-generated editorial images uploaded automatically to Supabase Storage.

## Required Vercel environment variables

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

## Supabase Storage

Create a public bucket named:

```bash
news-images
```

## Test image generation only

```bash
curl -X GET https://your-site.vercel.app/api/debug/image \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Expected success:

```json
{
  "ok": true,
  "image_url": "https://..."
}
```

If there is an OpenAI or Supabase error, the response will show it.

## Run daily cron

```bash
curl -X GET https://your-site.vercel.app/api/cron/daily \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

The response now returns:

```json
{
  "created": 6,
  "images_created": 6,
  "image_errors": []
}
```


## Fix for Vercel oversized ISR page

The homepage is forced dynamic with:

```ts
export const dynamic = "force-dynamic";
export const revalidate = 0;
```

This prevents Vercel from trying to pre-render a very large page when old rows contain base64 images.

Recommended cleanup in Supabase SQL Editor:

```sql
delete from posts
where image_url like 'data:%'
   or length(coalesce(image_url, '')) > 1000;
```

After cleanup, run the cron again so new images are uploaded as public Supabase Storage URLs instead of being stored as huge base64 strings.
