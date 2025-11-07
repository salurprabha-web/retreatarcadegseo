-- =====================================================
-- ADD DEMO EVENTS TO DATABASE
-- =====================================================
-- Run this script in Supabase SQL Editor to add 6 sample events
-- These will appear on the frontend /events page

INSERT INTO events (
  title,
  slug,
  summary,
  description,
  location,
  start_date,
  price,
  duration,
  status,
  is_featured,
  published_at
) VALUES
(
  'Grand Wedding Celebration',
  'grand-wedding-celebration',
  'Experience the grandeur of traditional Indian wedding ceremonies with modern elegance.',
  'Join us for a magnificent three-day wedding celebration that perfectly blends traditional Indian customs with contemporary elegance. From the vibrant Mehendi ceremony to the sacred wedding rituals, and culminating in a grand reception, this event promises to be an unforgettable experience. Our expert team will ensure every detail is executed flawlessly, creating memories that will last a lifetime.',
  'Mumbai, Maharashtra',
  '2025-11-15',
  250000,
  '3 days',
  'published',
  true,
  now()
),
(
  'Corporate Annual Gala',
  'corporate-annual-gala',
  'A prestigious corporate event featuring networking, entertainment, and awards.',
  'Elevate your corporate presence at our Annual Gala, a premier event designed to celebrate achievements, foster networking, and inspire future success. This sophisticated evening features keynote speakers, an awards ceremony, gourmet dining, and world-class entertainment. Perfect for recognizing excellence and building valuable business relationships in an elegant setting.',
  'Bangalore, Karnataka',
  '2025-12-01',
  500000,
  '1 day',
  'published',
  true,
  now()
),
(
  'Diwali Festival Extravaganza',
  'diwali-festival-extravaganza',
  'Celebrate the festival of lights with traditional rituals and modern festivities.',
  'Immerse yourself in the magic of Diwali with our two-day festival celebration. Experience traditional puja ceremonies, spectacular fireworks displays, cultural performances, and delicious festive cuisine. This event brings together families and communities to celebrate the victory of light over darkness in a setting filled with joy, color, and spiritual significance.',
  'Delhi NCR',
  '2025-10-20',
  150000,
  '2 days',
  'published',
  false,
  now()
),
(
  'Destination Beach Wedding',
  'destination-beach-wedding',
  'Say your vows against the backdrop of pristine beaches and stunning sunsets.',
  'Create the destination wedding of your dreams with our exclusive beach wedding package in Goa. Exchange vows with your toes in the sand as the sun sets over the Arabian Sea. Our four-day celebration includes beachside ceremonies, tropical-themed receptions, water sports activities, and luxurious accommodations. Let us turn your romantic vision into reality in this paradise setting.',
  'Goa',
  '2025-12-15',
  400000,
  '4 days',
  'published',
  true,
  now()
),
(
  'Tech Conference 2025',
  'tech-conference-2025',
  'Join industry leaders and innovators at this premier technology conference.',
  'Connect with the brightest minds in technology at our annual Tech Conference. This two-day event features cutting-edge presentations, interactive workshops, product demonstrations, and valuable networking opportunities. Explore emerging trends in AI, blockchain, cloud computing, and more. Whether you are a developer, entrepreneur, or tech enthusiast, this conference offers insights that will shape the future of technology.',
  'Hyderabad, Telangana',
  '2026-01-10',
  300000,
  '2 days',
  'published',
  false,
  now()
),
(
  'Holi Color Festival',
  'holi-color-festival',
  'Experience the vibrant colors and joyous spirit of the Holi festival.',
  'Celebrate the festival of colors with us in the beautiful city of Jaipur. This one-day extravaganza features safe, organic colors, live music, traditional dance performances, and authentic Rajasthani cuisine. Join thousands in this joyous celebration of spring, unity, and the triumph of good over evil. Perfect for families, friends, and anyone looking to experience the true spirit of Holi.',
  'Jaipur, Rajasthan',
  '2026-03-05',
  100000,
  '1 day',
  'published',
  false,
  now()
)
ON CONFLICT (slug) DO NOTHING;

-- Verify the events were added
SELECT title, location, start_date, price, status FROM events ORDER BY start_date;
