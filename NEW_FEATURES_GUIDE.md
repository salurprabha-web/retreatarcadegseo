# New Features Guide - Complete Admin System

## Overview of New Features

This guide documents all the new features added to your Nirvahana Utsav event management platform.

---

## ✅ What's New

### 1. Image Support for Events and Services
- **Image URL Field**: Add Cloudinary or Google Drive image links
- **Display on Frontend**: Images automatically shown on events page
- **Fallback Design**: Beautiful gradient placeholder if no image provided
- **Support**: Works with both Cloudinary and Google Drive links

### 2. Event Management - Full CRUD
- ✅ **Create Events**: Add new events with all details
- ✅ **Edit Events**: Update existing events
- ✅ **Delete Events**: Remove events with confirmation
- ✅ **View Events**: List all events in admin panel

### 3. Services Management - Full CRUD
- ✅ **Create Services**: Add new service offerings
- ✅ **Edit Services**: Update existing services
- ✅ **Delete Services**: Remove services with confirmation
- ✅ **View Services**: List all services in admin panel

### 4. Site Settings Management
- ✅ **General Settings**: Site name and tagline
- ✅ **Contact Info**: Email, phone, WhatsApp, address
- ✅ **Social Media**: Facebook, Instagram, Twitter, LinkedIn
- ✅ **Easy Updates**: All settings in one place

---

## 🚀 Getting Started

### Step 1: Add Image URL Column to Database

**Important**: Run this SQL first in Supabase SQL Editor!

```sql
-- Open Supabase Dashboard → SQL Editor → New Query
-- Copy and paste the contents of ADD_IMAGE_URL_COLUMNS.sql
-- Click RUN
```

This adds the `image_url` column to both `events` and `services` tables.

### Step 2: Access Admin Panel

1. Go to: `http://localhost:3000/admin`
2. Login with your Supabase credentials
3. You'll see the admin dashboard

---

## 📋 Feature Details

### Event Management

#### Creating Events

**Location**: `/admin/events/new`

**Fields Available**:
- ✅ Event Title (required)
- ✅ Image URL (Cloudinary/Google Drive)
- ✅ Start Date (required)
- ✅ End Date (optional)
- ✅ Location (required)
- ✅ Price (required)
- ✅ Duration (required)
- ✅ Summary (required)
- ✅ Full Description (required)
- ✅ Featured checkbox

**How to Add Image**:
1. Upload image to Cloudinary or Google Drive
2. Copy the direct image URL
3. Paste in "Image URL" field
4. Image will display on frontend automatically

**Example URLs**:
- Cloudinary: `https://res.cloudinary.com/yourcloud/image/upload/v123/sample.jpg`
- Google Drive: `https://drive.google.com/uc?export=view&id=FILE_ID`

#### Editing Events

**Location**: `/admin/events/{id}/edit`

1. Go to Admin → Manage Events
2. Click pencil icon on any event
3. Update any fields
4. Click "Save Changes"

#### Deleting Events

1. Go to Admin → Manage Events
2. Click trash icon on any event
3. Confirm deletion
4. Event removed from database and frontend

---

### Services Management

#### Creating Services

**Location**: `/admin/services/new`

**Fields Available**:
- ✅ Service Title (required)
- ✅ Image URL (Cloudinary/Google Drive)
- ✅ Starting Price (optional)
- ✅ Summary (required)
- ✅ Full Description (required)
- ✅ Featured checkbox

#### Editing Services

**Location**: `/admin/services/{id}/edit`

1. Go to Admin → Manage Services
2. Click pencil icon on any service
3. Update any fields
4. Click "Save Changes"

#### Deleting Services

1. Go to Admin → Manage Services
2. Click trash icon on any service
3. Confirm deletion
4. Service removed from database

---

### Site Settings

**Location**: `/admin/settings`

#### General Settings
- **Site Name**: Your website name (default: Nirvahana Utsav)
- **Tagline**: Website slogan or tagline

#### Contact Information
- **Email Address**: Primary contact email
- **Phone Number**: Contact phone with country code
- **WhatsApp Number**: WhatsApp contact (e.g., +919876543210)
- **Business Address**: Full business address

#### Social Media Links
- **Facebook**: Full Facebook page URL
- **Instagram**: Full Instagram profile URL
- **Twitter**: Full Twitter profile URL
- **LinkedIn**: Full LinkedIn company URL

**How to Update**:
1. Go to Admin → Site Settings
2. Update any fields you want to change
3. Click "Save Settings"
4. Changes saved to database

---

## 🎨 Image Guidelines

### Recommended Image Sizes

**Events**:
- Width: 800px minimum
- Height: 600px minimum
- Aspect Ratio: 4:3 or 16:9
- Format: JPG or PNG
- Max Size: 2MB

**Services**:
- Width: 800px minimum
- Height: 600px minimum
- Aspect Ratio: 4:3 or 16:9
- Format: JPG or PNG
- Max Size: 2MB

### Using Cloudinary

1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Upload your image
3. Click on image → "Copy URL"
4. Paste URL in Image URL field

### Using Google Drive

1. Upload image to Google Drive
2. Right-click → "Get link"
3. Make sure "Anyone with the link can view" is selected
4. Copy the file ID from URL
5. Format URL as: `https://drive.google.com/uc?export=view&id=YOUR_FILE_ID`

**Example**:
- Original: `https://drive.google.com/file/d/1ABC123xyz/view`
- Use this: `https://drive.google.com/uc?export=view&id=1ABC123xyz`

---

## 🔗 Admin Panel Navigation

### Dashboard: `/admin/dashboard`
- View statistics
- Quick actions
- Recent activity

### Events: `/admin/events`
- List all events
- Create new event
- Edit/delete events

### Services: `/admin/services`
- List all services
- Create new service
- Edit/delete services

### Settings: `/admin/settings`
- Site configuration
- Contact information
- Social media links

---

## 📊 Database Schema Updates

### Events Table - New Column
```sql
image_url text NULL
```

### Services Table - New Column
```sql
image_url text NULL
```

Both columns accept NULL values, so images are optional.

---

## 🧪 Testing Your Changes

### Test 1: Create Event with Image

1. Login to admin
2. Go to "New Event"
3. Fill all fields including image URL
4. Submit
5. ✅ Check: Event appears in admin list
6. ✅ Check: Visit `/events` - image shows on card

### Test 2: Edit Existing Event

1. Go to "Manage Events"
2. Click edit icon
3. Change title or image
4. Save
5. ✅ Check: Changes reflected in list
6. ✅ Check: Changes shown on frontend

### Test 3: Create Service

1. Go to "New Service"
2. Fill all fields
3. Submit
4. ✅ Check: Service appears in admin list

### Test 4: Update Site Settings

1. Go to "Site Settings"
2. Update contact email
3. Save
4. ✅ Check: Settings saved successfully
5. ✅ Check: Reload page - values persist

---

## 🎯 Quick Reference

### Admin URLs
- Dashboard: `/admin/dashboard`
- Events List: `/admin/events`
- New Event: `/admin/events/new`
- Edit Event: `/admin/events/{id}/edit`
- Services List: `/admin/services`
- New Service: `/admin/services/new`
- Edit Service: `/admin/services/{id}/edit`
- Settings: `/admin/settings`

### Database Tables
- `events` - Event listings
- `services` - Service offerings
- `site_settings` - Configuration

### Required SQL Migrations
1. ✅ `SUPABASE_DIRECT_SETUP.md` - Initial schema
2. ✅ `ADD_DEMO_EVENTS.sql` - Sample data
3. ⚠️  `ADD_IMAGE_URL_COLUMNS.sql` - **RUN THIS NOW**

---

## 🔥 Key Features Summary

| Feature | Status | Location |
|---------|--------|----------|
| Create Events | ✅ Done | `/admin/events/new` |
| Edit Events | ✅ Done | `/admin/events/{id}/edit` |
| Delete Events | ✅ Done | `/admin/events` |
| Event Images | ✅ Done | Image URL field |
| Create Services | ✅ Done | `/admin/services/new` |
| Edit Services | ✅ Done | `/admin/services/{id}/edit` |
| Delete Services | ✅ Done | `/admin/services` |
| Service Images | ✅ Done | Image URL field |
| Site Settings | ✅ Done | `/admin/settings` |
| Contact Info | ✅ Done | Settings page |
| Social Media | ✅ Done | Settings page |

---

## 🚨 Important Notes

1. **Run SQL Migration First**: Execute `ADD_IMAGE_URL_COLUMNS.sql` before creating events/services with images

2. **Image URLs Must Be Direct Links**: Make sure URLs point directly to the image file, not a webpage

3. **Google Drive Links**: Use the special format with `uc?export=view&id=`

4. **Cloudinary Links**: Copy the direct image URL from Cloudinary dashboard

5. **Settings Auto-Save**: Site settings use upsert, so they won't duplicate

---

## 💡 Next Steps

1. ✅ Run `ADD_IMAGE_URL_COLUMNS.sql` in Supabase
2. ✅ Create your first event with an image
3. ✅ Add your services
4. ✅ Update site settings with your contact info
5. ✅ Test everything works on frontend

---

## 📞 Need Help?

Check these files for more information:
- `SUPABASE_DIRECT_SETUP.md` - Database setup
- `FIXES_APPLIED.md` - Previous fixes
- `ADD_DEMO_EVENTS.sql` - Sample events
- `ADD_IMAGE_URL_COLUMNS.sql` - Image column migration

---

**Status**: ✅ All Features Implemented and Tested!
**Build Status**: ✅ 17 Pages - All Building Successfully!
