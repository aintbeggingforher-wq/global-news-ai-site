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
