-- Use in Supabase SQL Editor if you want to rebuild the site from zero.
-- This removes old posts and old avatar notes. It does not delete files from Storage.
delete from posts;
update posts set author_photo_note = null;
