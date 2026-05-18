# The American Desk — realistic newsroom build

This version fixes the old live-site issues:
- no more old “USA Daily Brief” branding
- functional section menu
- category pages and story pages
- author bylines for every post
- richer article structure with dek, body, reading time and source details
- automatic AI-generated editorial images uploaded to Supabase Storage
- homepage filters to prefer posts with images so old blank cards are less visible

## Required Supabase step

Run `supabase/schema.sql` in Supabase SQL Editor. It migrates the old table and adds:
- `slug`
- `dek`
- `body`
- `category`
- `subcategory`
- `author_name`
- `author_title`
- `reading_time`
- `image_alt`

It also inserts the Texas warehouse fire article with byline and image.

## Required Vercel environment variables

```bash
NEWS_API_KEY=
OPENAI_API_KEY=
OPENAI_TEXT_MODEL=gpt-4o-mini
OPENAI_IMAGE_MODEL=gpt-image-1
GENERATE_IMAGES=true
CRON_SECRET=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=news-images
```

## Test routes

```bash
curl -X GET https://your-site.vercel.app/api/debug/image \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

```bash
curl -X GET https://your-site.vercel.app/api/cron/daily \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Manual Texas fire post with fresh generated image:

```bash
curl -X GET https://your-site.vercel.app/api/manual/texas-fire \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Editorial note

Images are intentionally photorealistic but remain labeled as AI-generated editorial visuals. The system is instructed not to fabricate facts beyond what the source feed provides.
