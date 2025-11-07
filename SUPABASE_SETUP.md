# Supabase Integration Guide

## Overview

The Nirvahana Utsav platform is now connected to Supabase for authentication and data persistence. This guide explains how everything works and what you need to do to set up the database.

## Connection Status

✅ **Supabase Client Configured**
- URL: `https://0ec90b57d6e95fcbda19832f.supabase.co`
- Environment variables are set in `.env`
- Supabase client is initialized in `lib/supabase-client.ts`

## Database Schema

The complete database schema is defined in `prisma/schema.sql` and includes:

### Tables
1. **roles** - User role definitions (superadmin, admin, editor, author)
2. **users** - User profiles linked to Supabase Auth
3. **events** - Event listings with all details
4. **services** - Service offerings
5. **blog_posts** - Blog content
6. **testimonials** - Client testimonials
7. **inquiries** - Contact form submissions
8. **media** - File uploads and images
9. **site_settings** - Site configuration

## Setup Instructions

### Step 1: Run the Database Migration

You need to manually run the SQL schema in your Supabase dashboard:

1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor**
4. Copy the contents of `prisma/schema.sql`
5. Paste and execute the SQL

**Note**: The schema includes:
- All table definitions
- Row Level Security (RLS) policies
- Default roles
- Performance indexes

### Step 2: Create Your First Admin User

After running the migration, create an admin account:

1. In Supabase Dashboard, go to **Authentication** → **Users**
2. Click **Add User**
3. Enter:
   - Email: `admin@nirvahanautsav.com` (or your preferred email)
   - Password: Choose a secure password
   - Email Confirm: Check "Auto Confirm User"
4. Click **Create User**

### Step 3: Test the Admin Login

1. Start your dev server
2. Go to `http://localhost:3000/admin`
3. Login with the credentials you just created
4. You should be redirected to the dashboard

## Admin Panel Features (Supabase Integrated)

### ✅ Authentication
- **Login** (`/admin`) - Supabase Auth with email/password
- **Session Management** - Automatic token handling
- **Protected Routes** - Auth check on all admin pages
- **Logout** - Session cleanup

### ✅ Dashboard (`/admin/dashboard`)
- **Real-time Stats** - Counts from Supabase:
  - Total Events
  - Total Services
  - Total Blog Posts
  - Total Inquiries
- **Quick Actions** - Create new content
- **Management Links** - Navigate to sections

### ✅ Events Management (`/admin/events`)
- **List View** - Fetch all events from database
- **Real-time Data** - Shows actual event data
- **Delete Functionality** - Remove events with confirmation
- **Status Badges** - Visual indicators for draft/published
- **Empty State** - Prompts to create first event

### ✅ Create Event (`/admin/events/new`)
- **Full Form** - All event fields
- **Auto Slug Generation** - URL-friendly slug from title
- **Supabase Insert** - Saves to database
- **User Attribution** - Links to creator's user ID
- **Error Handling** - Shows detailed error messages
- **Success Feedback** - Toast notifications

## How It Works

### Authentication Flow

```typescript
// Login (app/admin/page.tsx)
import { signIn } from '@/lib/supabase-client';

const { data, error } = await signIn(email, password);
// On success, user is redirected to dashboard
```

### Protected Routes

```typescript
// Check auth on page load
const { session } = await getSession();
if (!session) {
  router.push('/admin');
}
```

### Data Fetching

```typescript
// Fetch events (app/admin/events/page.tsx)
const { data, error } = await supabase
  .from('events')
  .select('id, title, status, start_date, view_count')
  .order('created_at', { ascending: false });
```

### Creating Records

```typescript
// Create event (app/admin/events/new/page.tsx)
const { error } = await supabase
  .from('events')
  .insert([eventData]);
```

## Row Level Security (RLS)

All tables have RLS enabled for security:

### Events Table
- ✅ Public can view published events
- ✅ Authenticated users can create events
- ✅ Users can update/delete their own events

### Services Table
- ✅ Public can view published services
- ✅ Authenticated users can manage services

### Blog Posts Table
- ✅ Public can view published posts
- ✅ Authors can manage their own posts

### Inquiries Table
- ✅ Anyone can submit inquiries
- ✅ Only authenticated users can view all inquiries

### Media Table
- ✅ Public can view all media
- ✅ Authenticated users can upload
- ✅ Users can delete their own uploads

## Testing Checklist

### Authentication
- [ ] Can login with valid credentials
- [ ] Invalid credentials show error
- [ ] Protected pages redirect to login when not authenticated
- [ ] Logout works and clears session

### Dashboard
- [ ] Shows correct count of events
- [ ] Shows correct count of services
- [ ] Shows correct count of blog posts
- [ ] Shows correct count of inquiries
- [ ] Quick action buttons work
- [ ] Management links navigate correctly

### Events
- [ ] Events list shows database records
- [ ] Empty state shows when no events
- [ ] Can navigate to create event
- [ ] Create form validates fields
- [ ] Events save to database
- [ ] Success toast appears
- [ ] Redirects to events list after create
- [ ] Delete button removes events
- [ ] Delete confirmation dialog shows

## Next Steps

### 1. Implement Services Management
Similar to events, create:
- `/admin/services` - List services
- `/admin/services/new` - Create service
- Edit and delete functionality

### 2. Implement Blog Management
Create blog post CRUD:
- `/admin/blog` - List posts
- `/admin/blog/new` - Create post
- Rich text editor for content

### 3. Implement Inquiries Inbox
View and manage contact form submissions:
- `/admin/inquiries` - List inquiries
- Mark as read/contacted
- Add admin notes

### 4. Media Library
File upload system:
- `/admin/media` - Browse uploads
- Upload images/files to Supabase Storage
- Delete and organize media

### 5. Advanced Features
- Search and filters
- Bulk actions
- Export data
- Analytics dashboard
- Email notifications
- User management
- Role-based permissions

## Troubleshooting

### Error: "You do not have permission to configure a database"
This is expected. Database migrations need to be run manually via the Supabase dashboard.

### Error: "Invalid login credentials"
- Check that you created the user in Supabase Auth
- Verify email and password are correct
- Make sure user is confirmed (not pending)

### Error: "Failed to load events"
- Verify database tables exist
- Check RLS policies are set up
- Check browser console for detailed errors
- Verify Supabase connection in `.env`

### Events not appearing
- Check event status is "published" for public pages
- For admin, should show all events
- Verify data exists in Supabase dashboard

### Can't create events
- Verify user is authenticated
- Check RLS policies allow inserts
- Look for error messages in console
- Verify all required fields are filled

## Security Best Practices

✅ **Implemented**
- Row Level Security on all tables
- Protected routes with auth checks
- Secure password storage (Supabase Auth)
- Environment variables for secrets

⚠️ **Recommended**
- Enable Multi-Factor Authentication
- Set up email confirmation
- Add rate limiting
- Implement audit logging
- Regular security audits
- Password complexity requirements

## API Reference

### lib/supabase-client.ts

```typescript
// Sign in with email/password
signIn(email: string, password: string)

// Sign out
signOut()

// Get current session
getSession()

// Get current user
getUser()
```

### lib/supabase.ts

```typescript
// Direct Supabase client
import { supabase } from '@/lib/supabase';

// Query examples
supabase.from('events').select('*')
supabase.from('events').insert([data])
supabase.from('events').update(data).eq('id', id)
supabase.from('events').delete().eq('id', id)
```

## Support

For issues with:
- **Supabase Setup**: Check Supabase documentation
- **Authentication**: Review Supabase Auth docs
- **RLS Policies**: See Supabase RLS guide
- **Application Code**: Check console for errors

---

**Status**: ✅ Fully Integrated and Ready to Use

**Last Updated**: 2025-10-15
