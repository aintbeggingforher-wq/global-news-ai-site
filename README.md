# The American Desk — Newsroom Pro V3

A premium U.S. digital-news style site with:

- multiple sections and section pages
- detailed article pages
- automatic author assignment by category
- realistic AI-generated editorial images uploaded to Supabase Storage
- optional video support through official embeddable URLs
- manual Texas warehouse fire route

## Important video policy

This project does **not** download or reupload other outlets' videos. It supports embedding only when there is an official embeddable video URL, such as a YouTube embed URL. Always keep source attribution visible.

## Supabase setup

1. Open Supabase → SQL Editor.
2. Paste and run `supabase/schema.sql`.
3. Create or keep a public bucket named `news-images`.

## Vercel environment variables

```env
NEWS_API_KEY=
OPENAI_API_KEY=
OPENAI_TEXT_MODEL=gpt-4o-mini
OPENAI_IMAGE_MODEL=gpt-image-1
GENERATE_IMAGES=true
CRON_SECRET=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=news-images
SITE_NAME=The American Desk
SITE_TAGLINE=Sharp coverage of the day in America
```

## Test image generation

```bash
curl -X GET https://your-site.vercel.app/api/debug/image \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Run the daily newsroom update

```bash
curl -X GET https://your-site.vercel.app/api/cron/daily \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Create/regenerate the Texas warehouse fire feature

```bash
curl -X GET https://your-site.vercel.app/api/manual/texas-fire \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Clean old placeholder posts without images

```sql
delete from posts
where image_url is null
   or image_url = '';
```


## Timeout-safe Vercel settings

Recommended Vercel environment variables for Hobby plan:

```env
MAX_DAILY_POSTS=3
IMAGE_GENERATION_LIMIT=2
VIDEO_PROBABILITY=0.15
```

Then run the cron multiple times instead of generating many posts in one request.

To fill missing images in small batches:

```bash
curl -sS -X GET "https://your-site.vercel.app/api/maintenance/fill-images?limit=2" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```


# V5 Newsroom Realism — Higgsfield

Set in Vercel:

```env
IMAGE_PROVIDER=higgsfield
HF_KEY=your-api-key:your-api-secret
```

or:

```env
IMAGE_PROVIDER=higgsfield
HF_API_KEY=your-api-key
HF_API_SECRET=your-api-secret
```

Recommended:

```env
MAX_DAILY_POSTS=2
IMAGE_GENERATION_LIMIT=2
VIDEO_PROBABILITY=0.35
ENABLE_AD_SLOTS=true
AD_SLOT_FREQUENCY=24
```

Test Higgsfield:

```bash
curl -sS -X GET "https://your-site.vercel.app/api/debug/higgsfield" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Publish two daily posts:

```bash
curl -sS -X GET "https://your-site.vercel.app/api/cron/daily" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Visible image language uses subtle newsroom wording such as "Photo illustration" instead of loud AI labels. Sponsored blocks are labeled as Advertisement or Sponsored.

## V5 Higgsfield API Fix

This build uses the official Higgsfield client behavior:
- base URL: `https://platform.higgsfield.ai`
- auth header: `Authorization: Key <HF_KEY>`
- model endpoint path: `/bytedance/seedream/v4/text-to-image`

Test images:
```bash
curl -sS -X GET "https://your-site.vercel.app/api/debug/higgsfield" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Test NewsAPI:
```bash
curl -sS -X GET "https://your-site.vercel.app/api/debug/news" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```
