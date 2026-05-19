#!/bin/bash
set -e

SITE="${SITE:-https://global-news-ai-site.vercel.app}"
SECRET="${SECRET:-dailynews_secret_928374_world}"

echo "Creating 30 expanded newsroom posts across 10 categories..."
curl -sS -X GET "$SITE/api/manual/seed-expanded-newsroom?replace=1&images=0&videos=1&limit=30" \
  -H "Authorization: Bearer $SECRET"

echo ""
echo "Filling images with Higgsfield in small batches..."
for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15; do
  echo ""
  echo "===== IMAGE FILL RUN $i ====="
  curl -sS -X GET "$SITE/api/maintenance/fill-images?limit=2" \
    -H "Authorization: Bearer $SECRET"
  echo ""
  sleep 25
done

echo ""
echo "Done. Open: $SITE"
