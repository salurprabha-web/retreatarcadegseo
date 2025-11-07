import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Service, BlogPost, ContentPage } from '@/types';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient();
  const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: new Date(), priority: 1.0 },
    { url: `${baseUrl}/services`, lastModified: new Date(), priority: 0.8 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), priority: 0.8 },
  ];

  // Dynamic routes
  const { data: services } = await supabase.from('services').select('seo, created_at').returns<Pick<Service, 'seo' | 'created_at'>[]>();
  const serviceRoutes = services?.map(s => ({
    url: `${baseUrl}/services/${s.seo.slug}`,
    lastModified: new Date(s.created_at),
    priority: 0.7,
  })) || [];

  const { data: posts } = await supabase.from('blog_posts').select('seo, publish_date').eq('status', 'Published').returns<Pick<BlogPost, 'seo' | 'publish_date'>[]>();
  const postRoutes = posts?.map(p => ({
    url: `${baseUrl}/blog/${p.seo.slug}`,
    lastModified: new Date(p.publish_date),
    priority: 0.6,
  })) || [];

  const { data: pages } = await supabase.from('content_pages').select('seo, updated_at').returns<Pick<ContentPage, 'seo' | 'updated_at'>[]>();
  const pageRoutes = pages?.map(p => ({
    url: `${baseUrl}/${p.seo.slug}`,
    lastModified: new Date(p.updated_at),
    priority: 0.5,
  })) || [];

  return [...staticRoutes, ...serviceRoutes, ...postRoutes, ...pageRoutes];
}
