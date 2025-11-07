/*
  # Add Content Images to Blog Posts

  1. Changes
    - Rename `image_url` to `featured_image_url` for clarity
    - Add `content_images` column (jsonb array) for additional images in blog content
    - Add `reading_time` column to display estimated reading time
    - Add `tags` column (jsonb array) for blog post tags

  2. Notes
    - Run this migration from Supabase Dashboard SQL Editor
    - `content_images` stores array of image objects: [{"url": "...", "caption": "...", "alt": "..."}]
    - `tags` stores array of tag strings: ["event planning", "weddings", "tips"]
    - After running, update blog posts from admin panel to add images and tags
*/

-- Rename image_url to featured_image_url for clarity
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_posts' AND column_name = 'image_url'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_posts' AND column_name = 'featured_image_url'
  ) THEN
    ALTER TABLE blog_posts
    RENAME COLUMN image_url TO featured_image_url;
  END IF;
END $$;

-- Add content_images column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_posts' AND column_name = 'content_images'
  ) THEN
    ALTER TABLE blog_posts
    ADD COLUMN content_images JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Add reading_time column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_posts' AND column_name = 'reading_time'
  ) THEN
    ALTER TABLE blog_posts
    ADD COLUMN reading_time TEXT DEFAULT '5 min read';
  END IF;
END $$;

-- Add tags column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_posts' AND column_name = 'tags'
  ) THEN
    ALTER TABLE blog_posts
    ADD COLUMN tags JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;
