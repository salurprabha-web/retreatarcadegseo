/*
  # Fix RLS policies for events table

  1. Changes
    - Drop overly restrictive policies
    - Create simpler policies that work with authenticated sessions
    - Allow any authenticated user to manage events

  2. Security
    - Public can view published events
    - Authenticated users can create, update, and delete events
    - Admin panel will work with authenticated sessions
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Events are viewable by everyone" ON events;
DROP POLICY IF EXISTS "Authenticated users can insert events" ON events;
DROP POLICY IF EXISTS "Authenticated users can update events" ON events;
DROP POLICY IF EXISTS "Authenticated users can delete events" ON events;

-- Create new simplified policies
-- Anyone can view published events, authenticated users can view all
CREATE POLICY "Anyone can view published events"
  ON events FOR SELECT
  USING (status = 'published' OR auth.uid() IS NOT NULL);

-- Authenticated users can insert events
CREATE POLICY "Authenticated users can create events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Authenticated users can update any event
CREATE POLICY "Authenticated users can update events"
  ON events FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Authenticated users can delete any event
CREATE POLICY "Authenticated users can delete events"
  ON events FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);
