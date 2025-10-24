// api/sitemap.ts

import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from "@google/genai";
import type { Service, BlogPost, ContentPage } from '../types';

// This is the Vercel Serverless Function handler
export default async function handler(request: Request) {
    if (request.method !== 'GET') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    try {
        // 1. Initialize Supabase Client
        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error("Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are not set.");
        }
        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        // 2. Initialize Gemini Client
        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            throw new Error("API_KEY environment variable is not set.");
        }
        const ai = new GoogleGenAI({ apiKey });


        // 3. Fetch all public URLs
        const { data: services } = await supabase.from('services').select('seo(slug)').returns<{seo: {slug: string}}[]>();
        const { data: posts } = await supabase.from('blog_posts').select('seo(slug)').eq('status', 'Published').returns<{seo: {slug: string}}[]>();
        const { data: pages } = await supabase.from('content_pages').select('seo(slug)').returns<{seo: {slug: string}}[]>();

        // 4. Construct absolute URLs
        const siteUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';

        const urls = [
            siteUrl,
            `${siteUrl}/#/services`,
            `${siteUrl}/#/blog`,
            ...(services?.map(s => `${siteUrl}/#/services/${s.seo.slug}`) || []),
            ...(posts?.map(p => `${siteUrl}/#/blog/${p.seo.slug}`) || []),
            ...(pages?.map(p => `${siteUrl}/#/${p.seo.slug}`) || []),
        ];
        
        // 5. Generate Sitemap XML using Gemini
        const prompt = `Generate a valid sitemap.xml file using the sitemap protocol version 0.9. The output must be only the XML content, without any markdown formatting like \`\`\`xml.
        Create a <url> entry for each of the following URLs.
        - For the homepage ('${siteUrl}'), set priority to 1.0.
        - For primary pages like '/#/services' and '/#/blog', set priority to 0.8.
        - For all other specific service or blog pages, set priority to 0.6.
        - Use a 'weekly' changefreq for all URLs.
        - The current date for lastmod is ${new Date().toISOString().split('T')[0]}.
        
        URLs:
        ${urls.join('\n')}`;
        
        const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt });
        const sitemapXml = response.text.trim();

        // 6. Return the XML response
        return new Response(sitemapXml, {
            status: 200,
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Cache-Control': 's-maxage=86400, stale-while-revalidate', // Cache for 24 hours
            },
        });

    } catch (error: any) {
        console.error('Error generating sitemap:', error);
        return new Response(JSON.stringify({ error: `Failed to generate sitemap: ${error.message}` }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
