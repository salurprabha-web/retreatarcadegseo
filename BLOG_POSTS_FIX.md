# Blog Posts SQL Fix

## Issue

When running `ADD_DEMO_BLOG_POSTS.sql`, you got this error:
```
ERROR: 42703: column "summary" of relation "blog_posts" does not exist
```

## Root Cause

The `blog_posts` table structure in your database uses different column names than expected:
- Database has: `excerpt`
- Script was using: `summary`

Also missing columns:
- `author_name` (script used this, but table has `author_id` as foreign key)
- `category` (doesn't exist in original schema)
- `featured_image_url` (table has `featured_image_id` as foreign key)

## ✅ Fix Applied

Updated `ADD_DEMO_BLOG_POSTS.sql` to:

1. **Add missing columns first**:
   - `author_name` (text) - Simple text field for author name
   - `category` (text) - Blog post category
   - `featured_image_url` (text) - Direct image URL (Cloudinary/Google Drive)

2. **Use correct column name**:
   - Changed `summary` to `excerpt`

3. **Updated frontend**:
   - Changed `app/blog/page.tsx` to use `post.excerpt` instead of `post.summary`

## 🚀 How to Use

### Step 1: Run Fixed SQL Script

Open Supabase SQL Editor and run the updated `ADD_DEMO_BLOG_POSTS.sql`:

```sql
-- The script now:
-- 1. Adds missing columns (author_name, category, featured_image_url)
-- 2. Inserts 3 blog posts using correct column names
-- 3. Uses ON CONFLICT to prevent duplicates
```

### Step 2: Verify Data

Check your blog posts:
```sql
SELECT title, slug, excerpt, author_name, category, featured_image_url
FROM blog_posts
ORDER BY published_at DESC;
```

You should see:
- ✅ 10 Essential Tips for Planning Your Dream Wedding
- ✅ How to Organize Successful Corporate Events
- ✅ The Ultimate Guide to Cultural Festival Planning

### Step 3: Check Frontend

Visit `http://localhost:3000/blog` and you should see all 3 blog posts displaying correctly with:
- ✅ Images
- ✅ Author names
- ✅ Categories
- ✅ Excerpts
- ✅ Published dates

## 📋 Column Mapping

| Frontend Expects | Database Has | Solution |
|------------------|--------------|----------|
| `summary` | `excerpt` | ✅ Use `excerpt` |
| `author_name` | `author_id` (FK) | ✅ Add `author_name` column |
| `category` | ❌ Missing | ✅ Add `category` column |
| `featured_image_url` | `featured_image_id` (FK) | ✅ Add `featured_image_url` column |

## 🎯 What Changed

### Files Modified

1. **ADD_DEMO_BLOG_POSTS.sql**:
   - Added column creation logic
   - Changed `summary` → `excerpt`
   - Inserts now work correctly

2. **app/blog/page.tsx**:
   - Changed `post.summary` → `post.excerpt`

### Build Status

✅ **17 pages built successfully** - No errors!

## 📚 Related Files

- `ADD_DEMO_SERVICES.sql` - Services migration (already working)
- `ADD_DEMO_EVENTS.sql` - Events migration (already working)
- `ADD_IMAGE_URL_COLUMNS.sql` - Image URL support (already applied)
- `MIGRATE_FRONTEND_DATA.md` - Complete migration guide

## ✅ Status

**Fixed and tested!** Run the updated SQL script and your blog posts will appear in both the database and frontend.
