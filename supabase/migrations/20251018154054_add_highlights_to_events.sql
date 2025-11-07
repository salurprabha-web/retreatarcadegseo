/*
  # Add highlights field to events table

  1. Changes
    - Add `highlights` column to `events` table
      - Type: text array
      - Stores key highlights/features of the event
      - Default: empty array
      - Nullable for backward compatibility

  2. Notes
    - This allows admins to add bullet points highlighting key features
    - gallery_images field already exists for image gallery
    - price and duration fields will remain in database but won't be displayed in UI
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'highlights'
  ) THEN
    ALTER TABLE events ADD COLUMN highlights text[] DEFAULT '{}';
  END IF;
END $$;