-- =====================================================
-- CREATE ABOUT PAGE TABLE AND ADD DEFAULT CONTENT
-- =====================================================
-- Run this script in Supabase SQL Editor

-- Create about_page table
CREATE TABLE IF NOT EXISTS about_page (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'About Us',
  subtitle text NOT NULL,
  hero_image_url text,
  mission_title text NOT NULL DEFAULT 'Our Mission',
  mission_content text NOT NULL,
  vision_title text NOT NULL DEFAULT 'Our Vision',
  vision_content text NOT NULL,
  story_title text NOT NULL DEFAULT 'Our Story',
  story_content text NOT NULL,
  team_title text NOT NULL DEFAULT 'Our Team',
  team_description text NOT NULL,
  values text[] DEFAULT '{}',
  stats_clients integer DEFAULT 500,
  stats_events integer DEFAULT 1000,
  stats_years integer DEFAULT 10,
  stats_team integer DEFAULT 25,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE about_page ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access to about_page"
  ON about_page FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to manage about_page"
  ON about_page FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert default content
INSERT INTO about_page (
  title,
  subtitle,
  hero_image_url,
  mission_title,
  mission_content,
  vision_title,
  vision_content,
  story_title,
  story_content,
  team_title,
  team_description,
  values,
  stats_clients,
  stats_events,
  stats_years,
  stats_team
) VALUES (
  'About Nirvahana Utsav',
  'Creating Unforgettable Celebrations Since 2014',
  'https://images.pexels.com/photos/2253870/pexels-photo-2253870.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'Our Mission',
  'At Nirvahana Utsav, our mission is to transform your dreams into extraordinary celebrations. We are dedicated to creating unforgettable experiences that bring joy, connection, and lasting memories to every event we touch. Through meticulous planning, creative excellence, and unwavering commitment to quality, we strive to exceed expectations and make every celebration truly special.',
  'Our Vision',
  'We envision becoming India''s most trusted and innovative event management company, known for our creativity, reliability, and exceptional service. Our vision is to set new standards in the event industry by combining traditional values with modern innovation, creating celebrations that honor heritage while embracing contemporary trends.',
  'Our Story',
  'Founded in 2014, Nirvahana Utsav began with a simple belief: every celebration deserves to be extraordinary. What started as a small team of passionate event planners has grown into a full-service event management company serving clients across India. Over the years, we have had the privilege of being part of thousands of celebrations, from intimate family gatherings to grand corporate events. Our journey has been marked by countless smiles, joyful tears, and the satisfaction of seeing our clients'' visions come to life. Today, we continue to grow and evolve, always staying true to our core values of excellence, creativity, and genuine care for our clients.',
  'Meet Our Team',
  'Our success is driven by our talented team of event professionals who bring passion, creativity, and expertise to every project. From our experienced planners and creative designers to our skilled coordinators and support staff, each team member plays a vital role in creating exceptional events.',
  ARRAY['Excellence in Every Detail', 'Creative Innovation', 'Integrity & Trust', 'Client-Centered Approach', 'Cultural Sensitivity', 'Continuous Improvement'],
  500,
  1000,
  10,
  25
)
ON CONFLICT (id) DO NOTHING;

-- Verify the about page was created
SELECT title, subtitle, mission_title, vision_title, story_title FROM about_page;
