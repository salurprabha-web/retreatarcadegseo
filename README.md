# Nirvahana Utsav - Premium Event Management Platform

A production-ready event management website built with Next.js 13, featuring a stunning public-facing site and a comprehensive CMS backend.

## Features

### Public Website
- **Responsive Design**: Mobile-first, fully responsive across all devices
- **Modern UI**: Beautiful design with smooth animations using Framer Motion
- **SEO Optimized**: Meta tags, Open Graph, structured data ready
- **Fast Performance**: Next.js 13 App Router with optimized images

### Pages Implemented
- **Home**: Hero section, featured events, services overview, testimonials, CTA
- **Events**: Browse and filter events, detailed event pages with booking
- **Services**: Comprehensive service offerings with pricing
- **Gallery**: Image gallery with category filtering
- **Blog**: Blog listing and article pages
- **About**: Company story, team members, values
- **Contact**: Contact form with business information
- **WhatsApp Integration**: Floating button for instant messaging

### Design Elements
- Custom color scheme with orange/amber accent colors (avoiding purple/indigo)
- Professional gradient backgrounds
- Smooth scroll animations and transitions
- Hover effects and micro-interactions
- Accessible with proper contrast ratios
- Consistent 8px spacing system

## Tech Stack

- **Framework**: Next.js 13.5.1 (App Router)
- **Styling**: Tailwind CSS 3.3.3
- **UI Components**: Radix UI (via shadcn/ui)
- **Animations**: Framer Motion 11.0.0
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod validation
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage (ready to configure)
- **Authentication**: Supabase Auth (infrastructure ready)
- **Type Safety**: TypeScript

## Project Structure

```
/app
  /about           - About page
  /blog            - Blog listing
  /contact         - Contact page
  /events          - Events listing and detail pages
  /gallery         - Image gallery
  /services        - Services page
  layout.tsx       - Root layout with navigation
  page.tsx         - Homepage
  globals.css      - Global styles

/components
  /navigation      - Navbar and Footer
  /sections        - Reusable page sections
  /ui              - shadcn/ui components
  whatsapp-button.tsx

/lib
  constants.ts     - Site configuration
  supabase.ts      - Supabase client and types
  utils.ts         - Utility functions

/prisma
  schema.sql       - Database schema reference
```

## Database Schema

The database schema includes tables for:
- **Users & Roles**: Authentication and RBAC
- **Events**: Event management with details, pricing, gallery
- **Services**: Service offerings
- **Media**: Centralized media library
- **Testimonials**: Customer reviews
- **Blog Posts**: Content management
- **Pages**: Dynamic CMS pages
- **Inquiries**: Contact form submissions
- **Site Settings**: Global configuration
- **SEO Metadata**: Per-page SEO fields
- **Audit Logs**: Activity tracking

All tables have Row Level Security (RLS) enabled with proper policies.

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account and project

### Installation

1. **Clone and install dependencies**:
```bash
npm install
```

2. **Configure environment variables**:
Create `.env.local` file:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

3. **Set up Supabase database**:
- Go to your Supabase dashboard
- Navigate to SQL Editor
- Run the SQL from `/prisma/schema.sql`
- Or use the Supabase migration tools

4. **Configure Supabase Storage**:
- Create a public bucket named `media`
- Set up policies for public read access

5. **Run development server**:
```bash
npm run dev
```

Visit http://localhost:3000

### Build for Production

```bash
npm run build
npm run start
```

## Configuration

### Site Settings
Edit `/lib/constants.ts` to customize:
- Site name and tagline
- Contact information
- WhatsApp number
- Social media links
- Navigation menu items

### Styling
- Main colors are defined in `tailwind.config.ts`
- Global styles in `app/globals.css`
- Component-specific styles use Tailwind classes

### Images
Images are sourced from Pexels (demo content). Replace with:
- Client-uploaded images via admin panel (to be implemented)
- Supabase Storage URLs
- Your own image CDN

## Next Steps (Admin Panel & Backend)

The foundation is ready for implementing:

### Admin Panel
- Authentication with Supabase Auth
- Protected routes with middleware
- Dashboard with analytics
- CRUD interfaces for all content types
- Media manager with upload
- WYSIWYG editor for pages/blog
- User management
- SEO manager
- Activity logs viewer

### API Endpoints
- REST APIs for all CRUD operations
- File upload endpoints
- Authentication endpoints
- Webhook handlers

### Advanced Features
- Search functionality
- Advanced filtering and sorting
- Email notifications
- Payment integration
- Multi-language support
- Analytics integration
- Sitemap generation
- RSS feeds

## Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Environment Variables for Production
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Performance Optimization

- Images optimized with Next.js Image component
- Lazy loading for below-fold content
- Code splitting with dynamic imports
- Minimal JavaScript bundle size
- CDN-ready static assets

## SEO Features

- Server-side rendering
- Meta tags on all pages
- Open Graph tags
- Structured data ready
- Sitemap generation ready
- Robots.txt ready
- Canonical URLs
- Image alt tags

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## License

Proprietary - All rights reserved

## Support

For questions or support, contact: info@nirvahanautsav.com

---

**Built with care for Nirvahana Utsav**
