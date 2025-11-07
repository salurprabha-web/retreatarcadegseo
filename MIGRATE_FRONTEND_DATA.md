# Migrate Frontend Data to Database

## Overview

This guide will help you migrate the hardcoded services and blog posts from your frontend to the Supabase database, making them editable through the admin panel.

---

## ✅ What Was Fixed

### Problem
- Services and blog posts were visible on frontend (`/services` and `/blog`)
- But they were hardcoded and NOT in the database
- Admin panel showed empty lists
- You couldn't edit or manage them

### Solution
- Created SQL migration scripts to add data to database
- Updated frontend pages to fetch from Supabase
- Now everything is synced between frontend and admin panel

---

## 🚀 Migration Steps

### Step 1: Run Image URL Migration (If Not Done)

**File**: `ADD_IMAGE_URL_COLUMNS.sql`

1. Open Supabase Dashboard → SQL Editor
2. Copy/paste contents of `ADD_IMAGE_URL_COLUMNS.sql`
3. Click **RUN**

This adds the `image_url` column to events and services tables.

---

### Step 2: Migrate Services to Database

**File**: `ADD_DEMO_SERVICES.sql`

1. Open Supabase Dashboard → SQL Editor → New Query
2. Copy/paste contents of `ADD_DEMO_SERVICES.sql`
3. Click **RUN**

**This will add 6 services**:
- ✅ Wedding Planning (₹200,000)
- ✅ Corporate Events (₹150,000)
- ✅ Cultural Festivals (₹100,000)
- ✅ Private Celebrations (₹50,000)
- ✅ Social Gatherings (₹75,000)
- ✅ Special Occasions (₹60,000)

---

### Step 3: Migrate Blog Posts to Database

**File**: `ADD_DEMO_BLOG_POSTS.sql`

1. Open Supabase Dashboard → SQL Editor → New Query
2. Copy/paste contents of `ADD_DEMO_BLOG_POSTS.sql`
3. Click **RUN**

**This will add 3 blog posts**:
- ✅ 10 Essential Tips for Planning Your Dream Wedding
- ✅ How to Organize Successful Corporate Events
- ✅ The Ultimate Guide to Cultural Festival Planning

---

## 🎯 Verification

### Check Admin Panel

**Services**:
1. Login at `/admin`
2. Go to "Manage Services"
3. ✅ You should see 6 services listed

**Blog Posts** (when blog management is added):
1. Go to blog management
2. ✅ You should see 3 blog posts

### Check Frontend

**Services Page**:
1. Visit: `http://localhost:3000/services`
2. ✅ You should see 6 service cards
3. ✅ Each with image, title, description, and price

**Blog Page**:
1. Visit: `http://localhost:3000/blog`
2. ✅ You should see 3 blog post cards
3. ✅ Each with image, title, author, and date

---

## 📝 What Changed in the Code

### New Files Created

1. **lib/services.ts**
   - `getPublishedServices()` - Fetch all published services
   - `getServiceBySlug(slug)` - Fetch single service

2. **lib/blog.ts**
   - `getPublishedBlogPosts()` - Fetch all published blog posts
   - `getBlogPostBySlug(slug)` - Fetch single blog post

3. **SQL Migration Scripts**
   - `ADD_DEMO_SERVICES.sql` - Add 6 services to database
   - `ADD_DEMO_BLOG_POSTS.sql` - Add 3 blog posts to database

### Updated Files

1. **app/services/page.tsx**
   - ✅ Now fetches from Supabase
   - ✅ Shows database services
   - ✅ Displays images if available
   - ✅ Fallback icon if no image

2. **app/blog/page.tsx**
   - ✅ Now fetches from Supabase
   - ✅ Shows database blog posts
   - ✅ Displays featured images if available
   - ✅ Fallback icon if no image

---

## 🎨 Image Support

### Services

Each service now supports:
- **Image URL**: Cloudinary or Google Drive link
- **Fallback**: Icon-based gradient background
- **Icons**: Wedding (Heart), Corporate (Briefcase), Cultural (Music), etc.

### Blog Posts

Each blog post now supports:
- **Featured Image URL**: Cloudinary or Google Drive link
- **Fallback**: BookOpen icon with gradient background

---

## 🛠️ Managing Content

### Edit Services

1. Login to admin panel
2. Go to "Manage Services"
3. Click pencil icon on any service
4. Update title, description, price, or image URL
5. Changes appear immediately on frontend

### Edit Blog Posts

1. Login to admin panel
2. Go to blog management (when implemented)
3. Edit title, content, author, category, or image
4. Changes appear immediately on frontend

### Add New Content

**New Service**:
- Admin → Manage Services → Add New Service
- Fill all fields including image URL
- Publish

**New Blog Post**:
- Admin → Blog Management → Add New Post
- Fill all fields including featured image URL
- Publish

---

## 📊 Database Structure

### Services Table

```sql
- id (uuid)
- title (text)
- slug (text, unique)
- summary (text)
- description (text)
- image_url (text) ← NEW!
- price_from (numeric)
- status (enum: draft, published)
- is_featured (boolean)
- display_order (integer)
```

### Blog Posts Table

```sql
- id (uuid)
- title (text)
- slug (text, unique)
- summary (text)
- content (text, HTML)
- featured_image_url (text) ← Uses this field!
- author_name (text)
- category (text)
- status (enum: draft, published)
- is_featured (boolean)
- published_at (timestamp)
```

---

## 🔥 Quick Reference

### SQL Files to Run (In Order)

1. ✅ `ADD_IMAGE_URL_COLUMNS.sql` - Add image support
2. ✅ `ADD_DEMO_SERVICES.sql` - Populate services
3. ✅ `ADD_DEMO_BLOG_POSTS.sql` - Populate blog posts

### Frontend Pages Updated

- ✅ `/services` - Now fetches from database
- ✅ `/blog` - Now fetches from database

### Admin Management

- ✅ Create/Edit/Delete Services
- ✅ Update service images and pricing
- ⏳ Blog management (structure ready, CRUD pages needed)

---

## 🎉 What You Can Do Now

### Services
1. ✅ View all services in admin panel
2. ✅ Edit existing services
3. ✅ Add new services with images
4. ✅ Delete services
5. ✅ Set featured services
6. ✅ Update pricing

### Blog Posts
1. ✅ View blog posts on frontend
2. ✅ Data stored in database
3. ⏳ Admin CRUD pages (can be added later)

### Images
1. ✅ Add Cloudinary image URLs
2. ✅ Add Google Drive image URLs
3. ✅ Beautiful fallback if no image
4. ✅ Images show on frontend automatically

---

## 🚨 Important Notes

1. **Run Migrations in Order**:
   - First: `ADD_IMAGE_URL_COLUMNS.sql`
   - Then: `ADD_DEMO_SERVICES.sql`
   - Finally: `ADD_DEMO_BLOG_POSTS.sql`

2. **Images Are Optional**:
   - Services and blog posts work without images
   - Fallback icons/gradients show automatically

3. **Slug Must Be Unique**:
   - SQL scripts use `ON CONFLICT (slug) DO NOTHING`
   - Won't duplicate if you run scripts multiple times

4. **Frontend Auto-Updates**:
   - Changes in admin panel appear immediately on frontend
   - No cache issues (using `force-dynamic`)

---

## 📚 Documentation Files

- **NEW_FEATURES_GUIDE.md** - Complete feature documentation
- **MIGRATE_FRONTEND_DATA.md** - This file (migration guide)
- **FIXES_APPLIED.md** - Previous bug fixes
- **ADD_DEMO_EVENTS.sql** - Sample events
- **ADD_DEMO_SERVICES.sql** - Sample services
- **ADD_DEMO_BLOG_POSTS.sql** - Sample blog posts

---

## ✅ Build Status

**17 Pages Built Successfully**:
- All admin pages working
- All frontend pages working
- Services and blog fetching from database
- No TypeScript errors
- No blocking warnings

---

**Status**: ✅ Ready to migrate! Run the SQL scripts and your data will be in the database.
