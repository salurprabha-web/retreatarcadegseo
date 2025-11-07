# Supabase Database Setup - Direct Instructions

## Step-by-Step Guide to Set Up Your Database

Follow these instructions to set up your Supabase database from scratch using the Supabase dashboard.

---

## Step 1: Access Your Supabase Project

1. Go to **https://supabase.com/dashboard**
2. Log in to your account
3. Select your project (or create a new one if needed)

---

## Step 2: Set Up Authentication

### Create Your First Admin User

1. In the left sidebar, click **"Authentication"**
2. Click on **"Users"** tab
3. Click the **"Add User"** button (top right)
4. Fill in the form:
   - **Email**: `admin@nirvahanautsav.com` (or your preferred email)
   - **Password**: Create a strong password (you'll use this to login)
   - **Auto Confirm User**: ✅ Check this box (important!)
5. Click **"Create User"**

**Save these credentials** - you'll need them to login to your admin panel!

---

## Step 3: Create Database Tables

### 3.1 Open SQL Editor

1. In the left sidebar, click **"SQL Editor"**
2. Click **"New Query"** button

### 3.2 Copy and Paste This SQL

Copy the **ENTIRE** SQL script below and paste it into the SQL Editor:

```sql
-- =====================================================
-- NIRVAHANA UTSAV DATABASE SCHEMA
-- =====================================================

-- 1. CREATE ROLES TABLE
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- 2. CREATE USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text,
  role_id uuid REFERENCES roles(id) ON DELETE SET NULL,
  avatar_url text,
  is_active boolean DEFAULT true,
  two_factor_enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. CREATE MEDIA TABLE
CREATE TABLE IF NOT EXISTS media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  url text NOT NULL,
  storage_path text NOT NULL,
  mime_type text NOT NULL,
  size integer NOT NULL,
  width integer,
  height integer,
  alt_text text,
  caption text,
  tags text[] DEFAULT '{}',
  uploaded_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. CREATE EVENTS TABLE
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  summary text,
  description text NOT NULL,
  featured_image_id uuid REFERENCES media(id) ON DELETE SET NULL,
  start_date timestamptz,
  end_date timestamptz,
  location text,
  price numeric(10,2),
  duration text,
  max_participants integer,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_featured boolean DEFAULT false,
  view_count integer DEFAULT 0,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. CREATE SERVICES TABLE
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  summary text,
  description text NOT NULL,
  featured_image_id uuid REFERENCES media(id) ON DELETE SET NULL,
  price_from numeric(10,2),
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_featured boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6. CREATE TESTIMONIALS TABLE
CREATE TABLE IF NOT EXISTS testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  client_company text,
  client_avatar_id uuid REFERENCES media(id) ON DELETE SET NULL,
  content text NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  is_featured boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 7. CREATE BLOG_POSTS TABLE
CREATE TABLE IF NOT EXISTS blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  excerpt text,
  content text NOT NULL,
  featured_image_id uuid REFERENCES media(id) ON DELETE SET NULL,
  author_id uuid REFERENCES users(id) ON DELETE SET NULL,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_featured boolean DEFAULT false,
  view_count integer DEFAULT 0,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 8. CREATE INQUIRIES TABLE
CREATE TABLE IF NOT EXISTS inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  subject text,
  message text NOT NULL,
  event_id uuid REFERENCES events(id) ON DELETE SET NULL,
  service_id uuid REFERENCES services(id) ON DELETE SET NULL,
  status text DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'closed')),
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 9. CREATE SITE_SETTINGS TABLE
CREATE TABLE IF NOT EXISTS site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREATE SECURITY POLICIES
-- =====================================================

-- EVENTS POLICIES
CREATE POLICY "Anyone can view published events"
  ON events FOR SELECT
  USING (status = 'published');

CREATE POLICY "Authenticated users can create events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update events"
  ON events FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete events"
  ON events FOR DELETE
  TO authenticated
  USING (true);

-- SERVICES POLICIES
CREATE POLICY "Anyone can view published services"
  ON services FOR SELECT
  USING (status = 'published');

CREATE POLICY "Authenticated users can create services"
  ON services FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update services"
  ON services FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete services"
  ON services FOR DELETE
  TO authenticated
  USING (true);

-- BLOG_POSTS POLICIES
CREATE POLICY "Anyone can view published blog posts"
  ON blog_posts FOR SELECT
  USING (status = 'published');

CREATE POLICY "Authenticated users can create blog posts"
  ON blog_posts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update blog posts"
  ON blog_posts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete blog posts"
  ON blog_posts FOR DELETE
  TO authenticated
  USING (true);

-- TESTIMONIALS POLICIES
CREATE POLICY "Anyone can view approved testimonials"
  ON testimonials FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Authenticated users can manage testimonials"
  ON testimonials FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- INQUIRIES POLICIES
CREATE POLICY "Anyone can create inquiries"
  ON inquiries FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view all inquiries"
  ON inquiries FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update inquiries"
  ON inquiries FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- MEDIA POLICIES
CREATE POLICY "Anyone can view media"
  ON media FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can upload media"
  ON media FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update media"
  ON media FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete media"
  ON media FOR DELETE
  TO authenticated
  USING (true);

-- USERS POLICIES
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ROLES POLICIES
CREATE POLICY "Anyone can view roles"
  ON roles FOR SELECT
  USING (true);

-- SITE_SETTINGS POLICIES
CREATE POLICY "Anyone can view site settings"
  ON site_settings FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can update site settings"
  ON site_settings FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- INSERT DEFAULT DATA
-- =====================================================

-- Insert default roles
INSERT INTO roles (name, description) VALUES
  ('superadmin', 'Full system access with all permissions'),
  ('admin', 'Administrative access to manage content and users'),
  ('editor', 'Can create and manage content but limited user management'),
  ('author', 'Can create and manage own content only')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- CREATE PERFORMANCE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);
CREATE INDEX IF NOT EXISTS idx_services_slug ON services(slug);
CREATE INDEX IF NOT EXISTS idx_services_status ON services(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_email ON inquiries(email);
```

### 3.3 Run the SQL

1. After pasting the SQL, click the **"RUN"** button (bottom right)
2. Wait for it to complete (should take 5-10 seconds)
3. You should see a success message

---

## Step 4: Verify Tables Were Created

1. In the left sidebar, click **"Database"**
2. Click on **"Tables"** tab
3. You should see these 9 tables:
   - ✅ roles
   - ✅ users
   - ✅ media
   - ✅ events
   - ✅ services
   - ✅ testimonials
   - ✅ blog_posts
   - ✅ inquiries
   - ✅ site_settings

If you see all 9 tables, **congratulations!** Your database is set up correctly.

---

## Step 5: Get Your Connection Details

Your connection details are already in your `.env` file:

```
NEXT_PUBLIC_SUPABASE_URL=https://0ec90b57d6e95fcbda19832f.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**You don't need to change these!** They're already configured.

---

## Step 6: Test Your Setup

### 6.1 Start Your Application

```bash
npm run dev
```

### 6.2 Login to Admin Panel

1. Open your browser to: **http://localhost:3000/admin**
2. Enter the email and password you created in Step 2
3. Click **"Login"**

### 6.3 You Should See

- ✅ Successful login
- ✅ Redirect to admin dashboard
- ✅ Dashboard showing "0" for all stats (normal for new database)

### 6.4 Create Your First Event

1. Click **"Manage Events"** or **"New Event"**
2. Fill in the form:
   - **Title**: Test Event
   - **Date**: Any future date
   - **Location**: Mumbai, India
   - **Price**: 50000
   - **Duration**: 1 day
   - **Summary**: This is a test event
   - **Description**: Full description of the test event
3. Click **"Create Event"**
4. You should see a success message
5. Go back to events list - your event should appear!

---

## What You Can Do Now

✅ **Login to admin panel** - Use your Supabase Auth credentials
✅ **Create events** - Add events that save to your database
✅ **View events** - See all events in the admin panel
✅ **Delete events** - Remove events you don't want
✅ **Dashboard stats** - See real-time counts of your content

---

## Troubleshooting

### "Invalid login credentials"
- Make sure you created the user in Supabase Auth (Step 2)
- Check that "Auto Confirm User" was checked
- Try resetting the password in Supabase dashboard

### "Failed to load events"
- Make sure you ran the full SQL script (Step 3)
- Check that all 9 tables exist (Step 4)
- Open browser console (F12) to see detailed error

### "Failed to create event"
- Make sure you're logged in
- Check all required fields are filled
- Look at browser console for error details

### Tables don't show up
- Go back to SQL Editor
- Run the SQL script again (it's safe to run multiple times)
- Check for any error messages in red

---

## Need Help?

1. **Check browser console** (Press F12) - Shows detailed errors
2. **Check Supabase logs** - Dashboard → Logs section
3. **Verify RLS policies** - Dashboard → Authentication → Policies

---

## Summary

Your Supabase database is now:
- ✅ Fully configured with 9 tables
- ✅ Secured with Row Level Security
- ✅ Connected to your application
- ✅ Ready to use for events, services, blog, and more

**Next time you login**, you'll see your real data and can start managing your event management platform!
