/*
  # Add Event Detail Fields Migration

  1. New Columns Added to events table
    - `category` (text) - Event category (Wedding, Corporate, Cultural, etc.)
    - `gallery_images` (jsonb) - Array of gallery image URLs
    - `image_url` (text) - Direct image URL (for backward compatibility)

  2. Changes
    - Add category field with default 'General'
    - Add gallery_images as JSONB array to store multiple image URLs
    - Add image_url for featured image URL
    - These fields allow full control over event detail pages

  3. Security
    - Maintains existing RLS policies
    - No changes to security model

  4. Data Migration
    - Preserves all existing event data
    - Adds default values for new fields
*/

-- Add new columns to events table
DO $$
BEGIN
  -- Add category column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'category'
  ) THEN
    ALTER TABLE events ADD COLUMN category text DEFAULT 'General';
  END IF;

  -- Add gallery_images column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'gallery_images'
  ) THEN
    ALTER TABLE events ADD COLUMN gallery_images jsonb DEFAULT '[]'::jsonb;
  END IF;

  -- Add image_url column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE events ADD COLUMN image_url text;
  END IF;
END $$;

-- Add comment to describe the new fields
COMMENT ON COLUMN events.category IS 'Event category: Wedding, Corporate, Cultural, Festival, etc.';
COMMENT ON COLUMN events.gallery_images IS 'Array of image URLs for event gallery (Google Drive, Cloudinary, etc.)';
COMMENT ON COLUMN events.image_url IS 'Featured image URL for the event';

-- Create index on category for faster filtering
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);

-- Verify the migration
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'events'
AND column_name IN ('category', 'gallery_images', 'image_url')
ORDER BY column_name;
