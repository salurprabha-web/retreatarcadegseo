/*
  # Add Hero Background Image Support

  1. Changes
    - Add `hero_background_image` column to `homepage_settings` table
    - Column stores image URL for hero section background
    - Supports NULL value (no background image by default)

  2. Notes
    - Run this migration from Supabase Dashboard SQL Editor
    - After running, update homepage settings from admin panel to add background image
    - Image should be hosted on a CDN or use Google Drive direct link
*/

-- Add hero_background_image column to homepage_settings table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'homepage_settings' AND column_name = 'hero_background_image'
  ) THEN
    ALTER TABLE homepage_settings
    ADD COLUMN hero_background_image TEXT DEFAULT NULL;
  END IF;
END $$;
