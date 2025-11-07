/*
  # Create Media Table for Gallery

  1. New Tables
    - `media`
      - `id` (uuid, primary key)
      - `filename` (text) - Original filename
      - `url` (text) - Image URL (Cloudinary, Google Drive, etc.)
      - `alt_text` (text) - Alt text for accessibility
      - `caption` (text) - Image caption
      - `category` (text) - Category for filtering (Wedding, Corporate, Festival, Party)
      - `tags` (text array) - Tags for searching
      - `is_featured` (boolean) - Featured in gallery
      - `display_order` (integer) - Order in gallery
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `media` table
    - Add policy for public read access (gallery is public)
    - Add policy for authenticated users to manage media
*/

CREATE TABLE IF NOT EXISTS media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  url text NOT NULL,
  alt_text text,
  caption text,
  category text DEFAULT 'General',
  tags text[] DEFAULT '{}',
  is_featured boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Media is viewable by everyone"
  ON media
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert media"
  ON media
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update media"
  ON media
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete media"
  ON media
  FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_media_category ON media(category);
CREATE INDEX IF NOT EXISTS idx_media_is_featured ON media(is_featured);
CREATE INDEX IF NOT EXISTS idx_media_display_order ON media(display_order);
