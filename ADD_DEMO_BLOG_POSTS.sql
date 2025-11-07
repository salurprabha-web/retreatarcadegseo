-- =====================================================
-- ADD DEMO BLOG POSTS TO DATABASE
-- =====================================================
-- Run this script in Supabase SQL Editor to add 3 sample blog posts
-- These will appear in the admin panel and on the frontend

-- First, add columns that don't exist in the original schema
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_posts' AND column_name = 'author_name'
  ) THEN
    ALTER TABLE blog_posts ADD COLUMN author_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_posts' AND column_name = 'category'
  ) THEN
    ALTER TABLE blog_posts ADD COLUMN category text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_posts' AND column_name = 'featured_image_url'
  ) THEN
    ALTER TABLE blog_posts ADD COLUMN featured_image_url text;
  END IF;
END $$;

INSERT INTO blog_posts (
  title,
  slug,
  excerpt,
  content,
  featured_image_url,
  author_name,
  category,
  status,
  is_featured,
  published_at
) VALUES
(
  '10 Essential Tips for Planning Your Dream Wedding',
  '10-essential-tips-for-planning-your-dream-wedding',
  'Discover the key elements that will make your wedding day truly unforgettable. From choosing the perfect venue to managing your budget effectively.',
  '<h2>Planning Your Dream Wedding</h2>
<p>Your wedding day is one of the most important days of your life, and planning it should be an exciting journey. Here are 10 essential tips to help you create the wedding of your dreams:</p>

<h3>1. Set a Realistic Budget</h3>
<p>Before diving into planning, establish a clear budget and allocate funds to different aspects of your wedding. This will help guide your decisions and prevent overspending.</p>

<h3>2. Choose the Perfect Venue</h3>
<p>Your venue sets the tone for your entire wedding. Visit multiple locations, consider the season, and ensure it can accommodate your guest list comfortably.</p>

<h3>3. Start Early</h3>
<p>Give yourself plenty of time to plan. Ideally, start planning 12-18 months before your wedding date to secure the best vendors and venues.</p>

<h3>4. Hire Professional Vendors</h3>
<p>Invest in experienced photographers, caterers, and decorators who can bring your vision to life and handle unexpected challenges.</p>

<h3>5. Create a Detailed Timeline</h3>
<p>Plan your wedding day schedule down to the minute to ensure everything runs smoothly and you don''t miss any important moments.</p>

<h3>6. Personalize Your Ceremony</h3>
<p>Add personal touches that reflect your relationship and values. Custom vows, meaningful music, and unique decorations make your wedding truly yours.</p>

<h3>7. Consider Your Guests</h3>
<p>Think about guest comfort, dietary restrictions, and accessibility when making decisions about venue, menu, and timing.</p>

<h3>8. Plan for the Unexpected</h3>
<p>Have backup plans for outdoor events, keep an emergency kit handy, and consider wedding insurance for peace of mind.</p>

<h3>9. Delegate Responsibilities</h3>
<p>Don''t try to do everything yourself. Delegate tasks to trusted family members, friends, or hire a wedding planner to manage the details.</p>

<h3>10. Remember What Matters Most</h3>
<p>Amidst all the planning, remember that this day is about celebrating your love. Don''t stress over small imperfections – enjoy every moment!</p>

<p>Following these tips will help ensure your wedding day is everything you''ve dreamed of and more. Happy planning!</p>',
  'https://images.pexels.com/photos/2253870/pexels-photo-2253870.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Priya Sharma',
  'Wedding Planning',
  'published',
  true,
  '2025-10-01'
),
(
  'How to Organize Successful Corporate Events',
  'how-to-organize-successful-corporate-events',
  'Learn the best practices for planning corporate events that leave a lasting impression on your attendees and achieve your business objectives.',
  '<h2>Organizing Successful Corporate Events</h2>
<p>Corporate events are powerful tools for building relationships, showcasing your brand, and achieving business objectives. Here''s your comprehensive guide to organizing events that make an impact:</p>

<h3>Define Clear Objectives</h3>
<p>Start by identifying what you want to achieve. Is it networking, product launch, team building, or client appreciation? Clear objectives guide every planning decision.</p>

<h3>Know Your Audience</h3>
<p>Understand who will attend your event. Consider their interests, professional backgrounds, and expectations when planning content, venue, and activities.</p>

<h3>Choose the Right Venue</h3>
<p>Select a venue that reflects your brand and accommodates your needs. Consider location, capacity, technical capabilities, and amenities.</p>

<h3>Create Engaging Content</h3>
<p>Develop a program that balances information with entertainment. Include keynote speakers, panel discussions, networking sessions, and interactive elements.</p>

<h3>Leverage Technology</h3>
<p>Use event management software, mobile apps, and digital registration to streamline processes and enhance attendee experience.</p>

<h3>Professional Catering</h3>
<p>Quality food and beverages are crucial. Choose catering that suits your event style and accommodates dietary requirements.</p>

<h3>Brand Consistency</h3>
<p>Ensure all materials, from invitations to signage, reflect your corporate brand identity and messaging.</p>

<h3>Plan Logistics Carefully</h3>
<p>Coordinate transportation, parking, registration, and technical requirements well in advance to avoid day-of complications.</p>

<h3>Measure Success</h3>
<p>Collect feedback through surveys, track attendance and engagement metrics, and analyze ROI to improve future events.</p>

<h3>Follow Up</h3>
<p>Send thank-you messages, share event highlights, and maintain the connections made during your event.</p>

<p>With careful planning and attention to detail, your corporate events can become powerful tools for business growth and relationship building.</p>',
  'https://images.pexels.com/photos/2747449/pexels-photo-2747449.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Rajesh Kumar',
  'Corporate Events',
  'published',
  true,
  '2025-09-28'
),
(
  'The Ultimate Guide to Cultural Festival Planning',
  'the-ultimate-guide-to-cultural-festival-planning',
  'Celebrate traditions with authenticity and flair. Our comprehensive guide covers everything from venue selection to cultural considerations.',
  '<h2>Planning Authentic Cultural Festivals</h2>
<p>Cultural festivals are wonderful opportunities to celebrate heritage, bring communities together, and share traditions with others. Here''s your complete guide to planning memorable cultural celebrations:</p>

<h3>Understand Cultural Significance</h3>
<p>Research the cultural and historical context of the festival. Understanding traditions, rituals, and customs is essential for authentic celebration.</p>

<h3>Respect Traditions</h3>
<p>Work with cultural advisors or community elders to ensure traditional elements are honored and represented accurately.</p>

<h3>Choose an Appropriate Venue</h3>
<p>Select a space that can accommodate traditional ceremonies, performances, and gatherings while providing necessary amenities.</p>

<h3>Authentic Decorations</h3>
<p>Use traditional colors, symbols, and decorative elements that hold cultural significance. Avoid cultural appropriation by consulting with community members.</p>

<h3>Traditional Food and Beverages</h3>
<p>Serve authentic cuisine prepared using traditional methods. Food is a central element of cultural celebrations and should be given special attention.</p>

<h3>Cultural Performances</h3>
<p>Include traditional music, dance, and artistic performances. Invite authentic performers who understand the cultural context of their art.</p>

<h3>Educational Components</h3>
<p>Include information about the festival''s significance, history, and customs to help attendees understand and appreciate the celebration.</p>

<h3>Inclusive Planning</h3>
<p>Involve community members in planning to ensure the event represents diverse perspectives within the culture.</p>

<h3>Traditional Attire</h3>
<p>Encourage or provide traditional clothing for participants to enhance the authentic atmosphere of the celebration.</p>

<h3>Document and Share</h3>
<p>Capture photos and videos respectfully, and share the celebration in ways that educate and inspire others while honoring cultural sensitivities.</p>

<h3>Sustainable Practices</h3>
<p>Many traditional celebrations emphasize harmony with nature. Incorporate eco-friendly practices that align with cultural values.</p>

<p>By planning thoughtfully and respectfully, you can create cultural festivals that honor traditions while creating meaningful experiences for all participants.</p>',
  'https://images.pexels.com/photos/1157557/pexels-photo-1157557.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Anjali Verma',
  'Cultural Events',
  'published',
  false,
  '2025-09-25'
)
ON CONFLICT (slug) DO NOTHING;

-- Verify the blog posts were added
SELECT title, slug, author_name, category, published_at, status FROM blog_posts ORDER BY published_at DESC;
