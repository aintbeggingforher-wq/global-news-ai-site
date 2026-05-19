# The American Desk — Newsroom Pro V3

A premium U.S. digital-news style site with:

- multiple sections and section pages
- detailed article pages
- automatic author assignment by category
- realistic Higgsfield editorial photo illustrations uploaded to Supabase Storage
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


## Higgsfield model/body fix

This build uses the Higgsfield v2 documented text-to-image endpoint:

```env
HIGGSFIELD_MODEL=flux-pro/kontext/max/text-to-image
```

The request body is sent as:

```json
{
  "input": {
    "prompt": "...",
    "aspect_ratio": "16:9",
    "safety_tolerance": 2
  }
}
```

If Vercel still has the older `HIGGSFIELD_MODEL=bytedance/seedream/v4/text-to-image`, update it or delete it so the new default takes effect.

## Realistic image prompt upgrade

This build adds `lib/editorialPrompts.ts`, which creates stricter, topic-aware Higgsfield prompts. It reduces mismatched images and unrealistic scenes, especially for fire/disaster stories:

- firefighters/civilians must stay outside flames
- fire must originate from the building, not the ground
- public-health stories use hospital/lab/public-health settings, not disaster visuals
- politics, business, tech, climate, sports and culture each get specific visual rules
- author portrait notes are no longer displayed in the UI

## Rebuild posts cleanly

1. In Supabase SQL Editor, run:

```sql
delete from posts;
update posts set author_photo_note = null;
```

2. In Terminal, from your machine:

```bash
SITE="https://global-news-ai-site.vercel.app"
SECRET="dailynews_secret_928374_world"

curl -sS -X GET "$SITE/api/setup/author-photos" \
  -H "Authorization: Bearer $SECRET"

for i in 1 2 3 4; do
  curl -sS -X GET "$SITE/api/cron/daily" \
    -H "Authorization: Bearer $SECRET"
  sleep 20
  curl -sS -X GET "$SITE/api/maintenance/fill-images?limit=2" \
    -H "Authorization: Bearer $SECRET"
  sleep 20
done
```

Or use `scripts/regenerate-news.sh` locally after setting `SITE` and `CRON_SECRET` if needed.


# V6 All Solved — Higgsfield prompt fix

This build fixes the Higgsfield error:

```txt
"prompt" is a required property
```

The image request now sends `prompt` at the top level of the JSON body, which matches the current endpoint response your deployed app was receiving.

## Required Vercel variables

```env
IMAGE_PROVIDER=higgsfield
GENERATE_IMAGES=true
HF_KEY=your_api_key:your_api_secret
HIGGSFIELD_BASE_URL=https://platform.higgsfield.ai
HIGGSFIELD_MODEL=flux-pro/kontext/max/text-to-image
HIGGSFIELD_ASPECT_RATIO=16:9
HIGGSFIELD_SAFETY_TOLERANCE=2
HIGGSFIELD_POLL_LIMIT_MS=55000
```

## Create all seed posts

```bash
SITE="https://global-news-ai-site.vercel.app"
SECRET="dailynews_secret_928374_world"

curl -sS -X GET "$SITE/api/manual/seed-newsroom?replace=1&images=0&limit=10" \
  -H "Authorization: Bearer $SECRET"
```

## Fill images with Higgsfield

```bash
SITE="https://global-news-ai-site.vercel.app"
SECRET="dailynews_secret_928374_world"

for i in 1 2 3 4 5; do
  echo "===== IMAGE FILL RUN $i ====="
  curl -sS -X GET "$SITE/api/maintenance/fill-images?limit=2" \
    -H "Authorization: Bearer $SECRET"
  echo ""
  sleep 25
done
```


# V7 Expanded Newsroom

This build adds `/api/manual/seed-expanded-newsroom`, which creates 30 richer posts:
- 3 posts in each category
- longer articles for several key posts
- optional YouTube video attachment for selected posts if `YOUTUBE_API_KEY` is configured
- Higgsfield image prompts for every post

## Create the expanded newsroom

```bash
SITE="https://global-news-ai-site.vercel.app"
SECRET="dailynews_secret_928374_world"

curl -sS -X GET "$SITE/api/manual/seed-expanded-newsroom?replace=1&images=0&videos=1&limit=30" \
  -H "Authorization: Bearer $SECRET"
```

## Fill images

```bash
for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15; do
  curl -sS -X GET "$SITE/api/maintenance/fill-images?limit=2" \
    -H "Authorization: Bearer $SECRET"
  sleep 25
done
```

## Optional videos

Add this Vercel variable for real YouTube videos:

```env
YOUTUBE_API_KEY=your_youtube_data_api_key
VIDEO_PROBABILITY=1
```
