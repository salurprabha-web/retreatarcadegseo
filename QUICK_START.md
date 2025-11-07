# Quick Start Guide - SQL Migrations

Run these SQL scripts in order to set up all demo data and features.

---

## 📋 SQL Scripts to Run (In Order)

Open **Supabase Dashboard → SQL Editor** and run these scripts one by one:

### 1. Image URL Support (If Not Done)
**File**: `ADD_IMAGE_URL_COLUMNS.sql`

Adds `image_url` column to events and services tables.

---

### 2. Demo Services (If Not Done)
**File**: `ADD_DEMO_SERVICES.sql`

Adds 6 sample services:
- Wedding Planning
- Corporate Events
- Cultural Festivals
- Private Celebrations
- Social Gatherings
- Special Occasions

---

### 3. Demo Blog Posts (FIXED!)
**File**: `ADD_DEMO_BLOG_POSTS.sql`

Adds 3 sample blog posts with proper columns.

---

### 4. Demo Media Files (FIXED!)
**File**: `ADD_DEMO_MEDIA.sql`

Adds 6 sample media files to Media Library.

**Fix Applied**: Now adds unique constraint on `url` column first, then inserts media files.

---

### 5. About Page Setup (NEW!)
**File**: `CREATE_ABOUT_PAGE_TABLE.sql`

Creates the `about_page` table and adds default content.

---

## ✅ Verification

After running all scripts, verify:

1. **Services**: `/admin/services` - 6 services
2. **Media Library**: `/admin/media` - 6 media files
3. **About Page**: `/admin/about` - Default content

---

## 🎯 What's Ready

**Admin Features**:
- ✅ Media Library - Full CRUD
- ✅ About Page - Full CRUD
- ✅ Services - Full CRUD
- ✅ Events - Full CRUD
- ✅ Settings - Full CRUD

**Build Status**: ✅ 19 pages built successfully

---

**Status**: ✅ All SQL scripts fixed and ready to run!
