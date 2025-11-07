# Setup Instructions for Nirvahana Utsav

## Quick Start Guide

### Step 1: Install Dependencies

Due to network connectivity, you may need to retry installation:

```bash
npm install --legacy-peer-deps
```

If that fails, try:
```bash
npm cache clean --force
npm install
```

### Step 2: Supabase Setup

1. **Create Supabase Project**
   - Go to https://supabase.com
   - Create a new project
   - Note your project URL and anon key

2. **Configure Environment Variables**
   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

3. **Run Database Migration**
   - Open Supabase Dashboard → SQL Editor
   - Create new query
   - Copy contents from `prisma/schema.sql`
   - Execute the query

4. **Set Up Storage**
   - Go to Storage in Supabase Dashboard
   - Create a new bucket named `media`
   - Make it public for read access
   - Set policies:
     ```sql
     -- Allow public to read media
     CREATE POLICY "Public read access"
     ON storage.objects FOR SELECT
     USING (bucket_id = 'media');

     -- Allow authenticated users to upload
     CREATE POLICY "Authenticated users can upload"
     ON storage.objects FOR INSERT
     WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');
     ```

### Step 3: Initial Data Setup

Option A - Using SQL:
```sql
-- Insert some demo events
INSERT INTO events (title, slug, summary, description, location, start_date, price, duration, status)
VALUES
  ('Grand Wedding', 'grand-wedding', 'Beautiful wedding ceremony', 'Full description here', 'Mumbai', '2025-12-01', 250000, '3 days', 'published');
```

Option B - Using Supabase Dashboard:
- Use Table Editor to manually add records
- Start with roles, then users, then content

### Step 4: Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

### Step 5: Build & Test

```bash
npm run build
npm run start
```

## Troubleshooting

### npm install fails
- Clear npm cache: `npm cache clean --force`
- Delete node_modules: `rm -rf node_modules`
- Delete package-lock.json: `rm package-lock.json`
- Try again: `npm install`

### Supabase connection issues
- Verify environment variables are set correctly
- Check Supabase project is active
- Ensure API keys are copied correctly (no extra spaces)

### Build errors
- Check all imports are correct
- Verify TypeScript types
- Run `npm run typecheck` to find type errors

### Image loading issues
- Ensure image URLs are valid
- Check Next.js image optimization is working
- Verify Supabase storage is configured

## Next Implementation Steps

### Phase 1: Admin Authentication
1. Set up Supabase Auth
2. Create login page
3. Add middleware for protected routes
4. Implement session management

### Phase 2: Admin Dashboard
1. Create admin layout
2. Build dashboard with stats
3. Add navigation sidebar
4. Implement quick actions

### Phase 3: Content Management
1. Events CRUD interface
2. Services CRUD interface
3. Blog CRUD with rich editor
4. Media manager with upload
5. Pages CMS

### Phase 4: Advanced Features
1. SEO manager per page
2. Site settings manager
3. User management
4. Inquiry management
5. Analytics integration

### Phase 5: Production Readiness
1. Email notifications
2. Automated backups
3. Error monitoring
4. Performance optimization
5. Security hardening

## Environment Variables Reference

### Required
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anon key for client-side

### Optional (for backend features)
- `SUPABASE_SERVICE_ROLE_KEY` - Service role for admin operations
- `NEXTAUTH_SECRET` - NextAuth secret (if using NextAuth)
- `NEXTAUTH_URL` - Your app URL

## Deployment Checklist

- [ ] Environment variables configured in Vercel
- [ ] Supabase database migrations applied
- [ ] Storage buckets created and configured
- [ ] RLS policies enabled and tested
- [ ] Build succeeds locally
- [ ] All pages load correctly
- [ ] Forms submit successfully
- [ ] Images load from Supabase Storage
- [ ] SEO meta tags verified
- [ ] Mobile responsiveness tested
- [ ] Performance tested (Lighthouse score > 90)

## Support Resources

- Next.js Docs: https://nextjs.org/docs
- Supabase Docs: https://supabase.com/docs
- Tailwind Docs: https://tailwindcss.com/docs
- Framer Motion: https://www.framer.com/motion/

## Contact

For setup assistance: info@nirvahanautsav.com
