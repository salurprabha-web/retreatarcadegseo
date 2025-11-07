-- =====================================================
-- ADD DEMO SERVICES TO DATABASE
-- =====================================================
-- Run this script in Supabase SQL Editor to add 6 sample services
-- These will appear in the admin panel and on the frontend

INSERT INTO services (
  title,
  slug,
  summary,
  description,
  image_url,
  price_from,
  status,
  is_featured,
  published_at
) VALUES
(
  'Wedding Planning',
  'wedding-planning',
  'From intimate ceremonies to grand celebrations, we create your dream wedding with meticulous attention to every detail.',
  'Our comprehensive wedding planning service covers every aspect of your special day. We work closely with you to understand your vision and bring it to life with precision and care. From venue selection and vendor coordination to decoration, catering, and photography, we handle everything so you can focus on enjoying your celebration. Our experienced team ensures that every moment is perfect, from the intimate ceremony to the grand reception.',
  'https://images.pexels.com/photos/2253870/pexels-photo-2253870.jpeg?auto=compress&cs=tinysrgb&w=800',
  200000,
  'published',
  true,
  now()
),
(
  'Corporate Events',
  'corporate-events',
  'Professional event management for conferences, seminars, product launches, and corporate celebrations.',
  'Elevate your corporate presence with our professional event management services. We specialize in organizing conferences, seminars, product launches, annual meetings, and networking events that leave lasting impressions. Our team handles all logistics including venue selection, technical setup, catering, entertainment, and registration management. We understand the importance of brand representation and ensure your corporate event reflects your company''s values and objectives.',
  'https://images.pexels.com/photos/2747449/pexels-photo-2747449.jpeg?auto=compress&cs=tinysrgb&w=800',
  150000,
  'published',
  true,
  now()
),
(
  'Cultural Festivals',
  'cultural-festivals',
  'Authentic and vibrant cultural celebrations that honor traditions while creating unforgettable experiences.',
  'Celebrate your cultural heritage with our specialized festival planning services. We bring authenticity and vibrancy to traditional ceremonies, cultural programs, and festive celebrations. Our team understands the significance of cultural traditions and works diligently to honor them while creating memorable experiences. From organizing traditional ceremonies and entertainment to arranging authentic cuisine and culturally appropriate decor, we ensure every detail respects and celebrates your heritage.',
  'https://images.pexels.com/photos/1157557/pexels-photo-1157557.jpeg?auto=compress&cs=tinysrgb&w=800',
  100000,
  'published',
  false,
  now()
),
(
  'Private Celebrations',
  'private-celebrations',
  'Birthday parties, anniversaries, and milestone celebrations tailored to your unique preferences.',
  'Make your personal milestones unforgettable with our private celebration planning services. Whether it''s a birthday party, anniversary celebration, engagement party, baby shower, or themed event, we create experiences tailored to your unique preferences and style. Our team handles everything from venue decoration and catering to entertainment and photography, ensuring your special moment is celebrated in the most memorable way possible.',
  'https://images.pexels.com/photos/1306791/pexels-photo-1306791.jpeg?auto=compress&cs=tinysrgb&w=800',
  50000,
  'published',
  false,
  now()
),
(
  'Social Gatherings',
  'social-gatherings',
  'Expertly organized social events including reunions, cocktail parties, and community celebrations.',
  'Bring people together with our expertly organized social gathering services. From cocktail parties and reunions to charity events and community celebrations, we create the perfect atmosphere for connection and enjoyment. Our comprehensive planning includes venue selection, catering, entertainment, and logistics management. We ensure your social event runs smoothly and provides an enjoyable experience for all your guests.',
  'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=800',
  75000,
  'published',
  false,
  now()
),
(
  'Special Occasions',
  'special-occasions',
  'Make every occasion special with our comprehensive event planning and coordination services.',
  'Every occasion deserves to be celebrated in a special way. Our comprehensive event planning services cover retirement parties, graduations, religious ceremonies, award ceremonies, and fundraisers. We bring creativity, organization, and attention to detail to every event we plan. Our experienced team works with you to understand the significance of your occasion and create a celebration that honors the moment and creates lasting memories.',
  'https://images.pexels.com/photos/587741/pexels-photo-587741.jpeg?auto=compress&cs=tinysrgb&w=800',
  60000,
  'published',
  false,
  now()
)
ON CONFLICT (slug) DO NOTHING;

-- Verify the services were added
SELECT title, slug, price_from, status, is_featured FROM services ORDER BY display_order;
