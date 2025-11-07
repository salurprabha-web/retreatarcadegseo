/*
  # Add Service Detail Page Support with Gallery Images

  1. Changes to services table
    - Add `content` column for full detailed description (rich text/HTML)
    - Add `gallery_images` column to store array of image URLs
    - Add `highlights` column to store key points/features as array
    - Remove dependency on price_from for display (keep in DB but not required)

  2. Notes
    - The price_from field remains in the database but won't be displayed on frontend
    - Services will have detail pages accessible via slug
    - Gallery images will be displayed in a grid on the detail page
    - Each service can have multiple highlights/key features
*/

-- Add new columns to services table
DO $$
BEGIN
  -- Add content column for detailed description
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'services' AND column_name = 'content'
  ) THEN
    ALTER TABLE services ADD COLUMN content text;
  END IF;

  -- Add gallery_images column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'services' AND column_name = 'gallery_images'
  ) THEN
    ALTER TABLE services ADD COLUMN gallery_images text[] DEFAULT '{}';
  END IF;

  -- Add highlights column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'services' AND column_name = 'highlights'
  ) THEN
    ALTER TABLE services ADD COLUMN highlights text[] DEFAULT '{}';
  END IF;

  -- Add summary column for short description (if not exists)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'services' AND column_name = 'summary'
  ) THEN
    ALTER TABLE services ADD COLUMN summary text;
  END IF;

  -- Add title column (if using 'name' instead)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'services' AND column_name = 'title'
  ) THEN
    -- Copy data from 'name' to 'title' if name exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'services' AND column_name = 'name'
    ) THEN
      ALTER TABLE services ADD COLUMN title text;
      UPDATE services SET title = name WHERE title IS NULL;
    ELSE
      ALTER TABLE services ADD COLUMN title text NOT NULL DEFAULT '';
    END IF;
  END IF;

  -- Add status column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'services' AND column_name = 'status'
  ) THEN
    ALTER TABLE services ADD COLUMN status text DEFAULT 'draft';
  END IF;

  -- Add is_featured column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'services' AND column_name = 'is_featured'
  ) THEN
    ALTER TABLE services ADD COLUMN is_featured boolean DEFAULT false;
  END IF;

  -- Add price_from column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'services' AND column_name = 'price_from'
  ) THEN
    ALTER TABLE services ADD COLUMN price_from numeric;
  END IF;
END $$;

-- Update is_active to match status (if you have is_active)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'services' AND column_name = 'is_active'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'services' AND column_name = 'status'
  ) THEN
    UPDATE services
    SET status = CASE
      WHEN is_active = true THEN 'published'
      ELSE 'draft'
    END
    WHERE status IS NULL OR status = 'draft';
  END IF;
END $$;

-- Force PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
