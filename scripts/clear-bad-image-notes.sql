-- Use in Supabase SQL Editor to remove the old visible portrait note.
update posts set author_photo_note = null where author_photo_note is not null;

-- Optional: clear posts that have no image so /api/maintenance/fill-images can regenerate them.
update posts
set image_url = null
where image_url = '' or image_url like 'data:%';
