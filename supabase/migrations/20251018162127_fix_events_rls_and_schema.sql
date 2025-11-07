/*
  # Fix RLS policies and force schema refresh for events table

  1. Changes
    - Ensure highlights column exists
    - Drop overly restrictive policies
    - Create simpler policies that work with authenticated sessions
    - Force PostgREST schema cache reload

  2. Security
    - Public can view published events
    - Authenticated users can create, update, and delete events
*/

-- Ensure highlights column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'highlights'
  ) THEN
    ALTER TABLE events ADD COLUMN highlights text[] DEFAULT '{}';
  END IF;
END $$;

-- Drop existing policies
DROP POLICY IF EXISTS "Events are viewable by everyone" ON events;
DROP POLICY IF EXISTS "Authenticated users can insert events" ON events;
DROP POLICY IF EXISTS "Authenticated users can update events" ON events;
DROP POLICY IF EXISTS "Authenticated users can delete events" ON events;
DROP POLICY IF EXISTS "Anyone can view published events" ON events;
DROP POLICY IF EXISTS "Authenticated users can create events" ON events;
DROP POLICY IF EXISTS "Admin and authenticated users can insert events" ON events;
DROP POLICY IF EXISTS "Admin and authenticated users can update events" ON events;
DROP POLICY IF EXISTS "Admin and authenticated users can delete events" ON events;

-- Create new simplified policies
CREATE POLICY "Public read published events"
  ON events FOR SELECT
  USING (status = 'published' OR auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated insert events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated update events"
  ON events FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated delete events"
  ON events FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Force PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
