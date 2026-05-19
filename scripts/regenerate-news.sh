#!/usr/bin/env bash
set -euo pipefail

SITE="${SITE:-https://global-news-ai-site.vercel.app}"
SECRET="${CRON_SECRET:-dailynews_secret_928374_world}"
RUNS="${RUNS:-4}"
FILL_LIMIT="${FILL_LIMIT:-2}"
SLEEP_SECONDS="${SLEEP_SECONDS:-20}"

echo "1. Testing Higgsfield image generation..."
curl -sS -X GET "$SITE/api/debug/higgsfield" \
  -H "Authorization: Bearer $SECRET"
echo -e "\n"

echo "2. Regenerating author portraits..."
curl -sS -X GET "$SITE/api/setup/author-photos" \
  -H "Authorization: Bearer $SECRET"
echo -e "\n"

echo "3. Publishing daily posts and filling images..."
for i in $(seq 1 "$RUNS"); do
  echo "===== DAILY RUN $i ====="
  curl -sS -X GET "$SITE/api/cron/daily" \
    -H "Authorization: Bearer $SECRET"
  echo -e "\nWaiting ${SLEEP_SECONDS}s..."
  sleep "$SLEEP_SECONDS"

  echo "===== IMAGE FILL RUN $i ====="
  curl -sS -X GET "$SITE/api/maintenance/fill-images?limit=$FILL_LIMIT" \
    -H "Authorization: Bearer $SECRET"
  echo -e "\nWaiting ${SLEEP_SECONDS}s..."
  sleep "$SLEEP_SECONDS"
done

echo "Done: $SITE"
