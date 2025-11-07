import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';
import type { Service, BlogPost, ContentPage } from '../types';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return new Response('Supabase credentials missing', { status: 500 });
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
  const { origin } = new URL(request.url);

  try {
    const { data: services } = await supabase
      .from('services')
      .select('seo, created_at');

    const { data: posts } = await supabase
      .from('blog_posts')
      .select('seo, publish_date')
      .eq('status', 'Published');

    const { data: pages } = await supabase
      .from('content_pages')
      .select('seo, updated_at');

    const urls = [
      {
        loc: `${origin}/`,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'daily',
        priority: '1.0',
      },
      {
        loc: `${origin}/services`,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'weekly',
        priority: '0.8',
      },
      {
        loc: `${origin}/blog`,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'weekly',
        priority: '0.8',
      },
    ];

    services?.forEach(s => {
      urls.push({
        loc: `${origin}/services/${s.seo.slug}`,
        lastmod: new Date(s.created_at).toISOString().split('T')[0],
        changefreq: 'monthly',
        priority: '0.7',
      });
    });

    posts?.forEach(p => {
      urls.push({
        loc: `${origin}/blog/${p.seo.slug}`,
        lastmod: p.publish_date,
        changefreq: 'monthly',
        priority: '0.6',
      });
    });

    pages?.forEach(p => {
      urls.push({
        loc: `${origin}/${p.seo.slug}`,
        lastmod: new Date(p.updated_at).toISOString().split('T')[0],
        changefreq: 'yearly',
        priority: '0.5',
      });
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    url => `
  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`
  )
  .join('')}
</urlset>`;

    return new Response(xml, {
      status: 200,
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    });
  } catch (err: any) {
    return new Response('Sitemap generation error', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}
