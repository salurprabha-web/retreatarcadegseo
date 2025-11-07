/*
  # Create Homepage Settings Table

  1. New Tables
    - `homepage_settings`
      - `id` (uuid, primary key)
      - `hero_title` (text) - Main hero title
      - `hero_subtitle` (text) - Hero subtitle/description
      - `hero_button_text` (text) - Primary button text
      - `hero_button_link` (text) - Primary button link
      - `hero_secondary_button_text` (text) - Secondary button text
      - `hero_secondary_button_link` (text) - Secondary button link
      - `stat_events_value` (text) - Events stat value
      - `stat_events_label` (text) - Events stat label
      - `stat_clients_value` (text) - Clients stat value
      - `stat_clients_label` (text) - Clients stat label
      - `stat_team_value` (text) - Team stat value
      - `stat_team_label` (text) - Team stat label
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `homepage_settings` table
    - Add policy for public read access
    - Add policy for authenticated users to update
*/

-- Create homepage_settings table
CREATE TABLE IF NOT EXISTS homepage_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hero_title text NOT NULL DEFAULT 'Create Unforgettable Celebrations',
  hero_subtitle text NOT NULL DEFAULT 'Expert event management and cultural celebrations that bring your vision to life',
  hero_button_text text NOT NULL DEFAULT 'Explore Events',
  hero_button_link text NOT NULL DEFAULT '/events',
  hero_secondary_button_text text NOT NULL DEFAULT 'Contact Us',
  hero_secondary_button_link text NOT NULL DEFAULT '/contact',
  stat_events_value text NOT NULL DEFAULT '100+ Events',
  stat_events_label text NOT NULL DEFAULT 'Successfully organized',
  stat_clients_value text NOT NULL DEFAULT '5000+ Guests',
  stat_clients_label text NOT NULL DEFAULT 'Satisfied customers',
  stat_team_value text NOT NULL DEFAULT 'Expert Team',
  stat_team_label text NOT NULL DEFAULT 'Professional planners',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE homepage_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Anyone can view homepage settings"
  ON homepage_settings FOR SELECT
  TO public
  USING (true);

-- Allow authenticated users to insert/update
CREATE POLICY "Authenticated users can insert homepage settings"
  ON homepage_settings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update homepage settings"
  ON homepage_settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert default homepage settings
INSERT INTO homepage_settings (
  hero_title,
  hero_subtitle,
  hero_button_text,
  hero_button_link,
  hero_secondary_button_text,
  hero_secondary_button_link,
  stat_events_value,
  stat_events_label,
  stat_clients_value,
  stat_clients_label,
  stat_team_value,
  stat_team_label
) VALUES (
  'Create Unforgettable Celebrations',
  'Expert event management and cultural celebrations that bring your vision to life',
  'Explore Events',
  '/events',
  'Contact Us',
  '/contact',
  '100+ Events',
  'Successfully organized',
  '5000+ Guests',
  'Satisfied customers',
  'Expert Team',
  'Professional planners'
) ON CONFLICT DO NOTHING;

-- Verify the table was created
SELECT * FROM homepage_settings;
