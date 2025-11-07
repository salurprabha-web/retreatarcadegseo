-- =====================================================
-- ADD DEMO MEDIA FILES TO DATABASE
-- =====================================================
-- Run this script in Supabase SQL Editor to add sample media files
-- These will appear in the Media Library admin panel

-- First, add unique constraint on URL to prevent duplicates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'media_url_unique'
  ) THEN
    ALTER TABLE media ADD CONSTRAINT media_url_unique UNIQUE (url);
  END IF;
END $$;

INSERT INTO media (
  filename,
  url,
  storage_path,
  mime_type,
  size,
  alt_text,
  tags
) VALUES
(
  'wedding-decoration.jpg',
  'https://images.pexels.com/photos/2253870/pexels-photo-2253870.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/2253870/pexels-photo-2253870.jpeg?auto=compress&cs=tinysrgb&w=800',
  'image/jpeg',
  0,
  'Beautiful wedding decoration with elegant setup',
  ARRAY['wedding', 'decoration', 'elegant']
),
(
  'corporate-event.jpg',
  'https://images.pexels.com/photos/2747449/pexels-photo-2747449.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/2747449/pexels-photo-2747449.jpeg?auto=compress&cs=tinysrgb&w=800',
  'image/jpeg',
  0,
  'Professional corporate event setup',
  ARRAY['corporate', 'business', 'conference']
),
(
  'cultural-festival.jpg',
  'https://images.pexels.com/photos/1157557/pexels-photo-1157557.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1157557/pexels-photo-1157557.jpeg?auto=compress&cs=tinysrgb&w=800',
  'image/jpeg',
  0,
  'Vibrant cultural festival celebration',
  ARRAY['cultural', 'festival', 'traditional']
),
(
  'birthday-party.jpg',
  'https://images.pexels.com/photos/1306791/pexels-photo-1306791.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1306791/pexels-photo-1306791.jpeg?auto=compress&cs=tinysrgb&w=800',
  'image/jpeg',
  0,
  'Colorful birthday party celebration',
  ARRAY['birthday', 'party', 'celebration']
),
(
  'social-gathering.jpg',
  'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=800',
  'image/jpeg',
  0,
  'Elegant social gathering event',
  ARRAY['social', 'gathering', 'networking']
),
(
  'special-occasion.jpg',
  'https://images.pexels.com/photos/587741/pexels-photo-587741.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/587741/pexels-photo-587741.jpeg?auto=compress&cs=tinysrgb&w=800',
  'image/jpeg',
  0,
  'Special occasion celebration with cake',
  ARRAY['celebration', 'cake', 'special']
)
ON CONFLICT (url) DO NOTHING;

-- Verify the media files were added
SELECT filename, url, alt_text, tags FROM media ORDER BY created_at DESC;
