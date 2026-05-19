select
  category,
  count(*) as total_posts,
  count(image_url) as posts_with_images,
  count(video_embed_url) as posts_with_video,
  count(*) - count(image_url) as posts_without_images
from posts
group by category
order by category;
