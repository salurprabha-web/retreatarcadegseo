# Admin Panel Access Guide

## How to Access the Admin Panel

### Step 1: Navigate to Admin Login
Open your browser and go to:
```
http://localhost:3000/admin
```

### Step 2: Login with Demo Credentials

**Email:** `admin@nirvahanautsav.com`
**Password:** `admin123`

These credentials are displayed on the login page for easy access during development.

## Admin Panel Features

### Dashboard (`/admin/dashboard`)
- **Overview Statistics**: View counts for events, services, blog posts, and inquiries
- **Quick Actions**: Fast access to create new content
- **Management Links**: Navigate to different admin sections
- **Recent Activity**: See latest changes and updates

### Events Management (`/admin/events`)
- View all events in a sortable table
- See event status (published/draft)
- View metrics (views, date)
- Edit or delete events
- Create new events (`/admin/events/new`)

### Event Creation (`/admin/events/new`)
- Complete form for adding new events
- Fields include:
  - Event title
  - Date and location
  - Price and duration
  - Summary and description
- Form validation
- Success notifications

## Navigation Structure

```
/admin                    → Login page
  /admin/dashboard        → Main dashboard
    /admin/events         → Events list
      /admin/events/new   → Create new event
    /admin/services       → Services management (placeholder)
    /admin/blog           → Blog management (placeholder)
    /admin/inquiries      → View inquiries (placeholder)
    /admin/settings       → Site settings (placeholder)
    /admin/media          → Media library (placeholder)
```

## Features Implemented

✅ **Authentication**
- Simple localStorage-based auth (demo mode)
- Protected routes
- Login/Logout functionality

✅ **Dashboard**
- Statistics cards
- Quick action buttons
- Management navigation
- Activity feed

✅ **Events Management**
- List all events with table view
- Status badges
- Edit/Delete actions
- Create new event form

✅ **UI Components**
- Clean, modern design
- Responsive layout
- Shadcn/ui components
- Toast notifications

## How It Works (Demo Mode)

### Authentication
Currently uses localStorage for simplicity. In production, this should be replaced with:
- Supabase Auth
- JWT tokens
- Secure session management
- Role-based access control

### Data Storage
Currently displays demo/static data. To connect to Supabase:
1. Replace demo data arrays with Supabase queries
2. Implement CRUD operations using Supabase client
3. Add real-time updates
4. Enable file uploads to Supabase Storage

## Testing the Admin Panel

### 1. Test Login
- Go to `/admin`
- Enter credentials
- Should redirect to dashboard

### 2. Test Dashboard
- Verify statistics display
- Click quick action buttons
- Test navigation links

### 3. Test Events Management
- Go to "Manage Events"
- View events list
- Click "Add New Event"
- Fill out form
- Submit (shows success toast)

### 4. Test Logout
- Click logout button
- Should redirect to login page
- Try accessing dashboard (should redirect to login)

## Next Steps for Production

### 1. Implement Real Authentication
```typescript
// Use Supabase Auth instead of localStorage
import { supabase } from '@/lib/supabase';

const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});
```

### 2. Connect to Database
```typescript
// Fetch real events from Supabase
const { data: events } = await supabase
  .from('events')
  .select('*')
  .order('created_at', { ascending: false });
```

### 3. Implement CRUD Operations
- Create: Insert into Supabase
- Read: Query with filters
- Update: Update records
- Delete: Soft delete or hard delete

### 4. Add More Admin Features
- Services management
- Blog post editor with rich text
- Media library with upload
- Inquiries inbox
- Site settings manager
- User management
- SEO manager
- Analytics dashboard

## Security Notes

⚠️ **Important**: Current implementation is for DEMO purposes only!

For production:
1. Never use localStorage for authentication
2. Implement proper JWT/session management
3. Add CSRF protection
4. Use environment variables for secrets
5. Implement rate limiting
6. Add audit logging
7. Enable MFA for admin users
8. Use HTTPS only
9. Implement proper error handling
10. Add input sanitization

## Troubleshooting

### Can't access admin pages
- Clear localStorage: `localStorage.clear()`
- Try login again

### Pages not loading
- Check browser console for errors
- Verify build was successful
- Restart dev server

### Forms not submitting
- Check browser console
- Verify toast notifications are working
- Check form validation

## Quick Reference

**Login URL:** `http://localhost:3000/admin`
**Dashboard:** `http://localhost:3000/admin/dashboard`
**Email:** `admin@nirvahanautsav.com`
**Password:** `admin123`

---

**Note**: This is a basic admin panel implementation. For a full-featured CMS, additional development is needed to connect all features to Supabase and implement complete CRUD operations.
