#!/bin/bash
set -e

SITE="${SITE:-https://global-news-ai-site.vercel.app}"
SECRET="${SECRET:-dailynews_secret_928374_world}"

echo "1) Creating / replacing seed newsroom posts..."
curl -sS -X GET "$SITE/api/manual/seed-newsroom?replace=1&images=0&limit=10" \
  -H "Authorization: Bearer $SECRET"

echo ""
echo "2) Filling images with Higgsfield in small batches..."
for i in 1 2 3 4 5; do
  echo ""
  echo "===== IMAGE FILL RUN $i ====="
  curl -sS -X GET "$SITE/api/maintenance/fill-images?limit=2" \
    -H "Authorization: Bearer $SECRET"
  echo ""
  sleep 25
done

echo ""
echo "Done. Open: $SITE"
