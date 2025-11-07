import React, { useEffect, useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import HomePage from './HomePage';
import ServicesPage from './ServicesPage';
import ServiceDetailPage from './ServiceDetailPage';
import BlogPage from './BlogPage';
import BlogDetailPage from './BlogDetailPage';
import ContentPage from './ContentPage';
import { supabase } from '../../services/supabaseClient';
import { Service, BlogPost, ContentPage as ContentPageType, SiteSettings } from '../../types';
import Loader from '../common/Loader';

const WhatsAppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99 0-3.903-.52-5.687-1.475L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.433-9.89-9.889-9.89-5.452 0-9.887 4.434-9.889 9.891.001 2.23.652 4.395 1.846 6.233l-.985 3.638 3.732-.986zm-1.57-2.97-.57-.34c-1.423-.85-2.822-2.12-3.86-3.626l-.23-.36.004-.36c.004-3.303 2.699-5.999 6.005-5.999 1.58 0 3.061.624 4.159 1.722l.123.123c1.099 1.098 1.718 2.575 1.719 4.153.002 3.303-2.698 5.999-6.004 5.999-1.334 0-2.62-.423-3.692-1.22l-.24-.179z"/></svg>
);

interface PublicWebsiteProps {
    route: string;
}

const PublicWebsite: React.FC<PublicWebsiteProps> = ({ route }) => {
    const [loading, setLoading] = useState(true);
    const [siteData, setSiteData] = useState<{
        services: Service[];
        blogPosts: BlogPost[];
        contentPages: ContentPageType[];
        settings: SiteSettings | null;
    }>({ services: [], blogPosts: [], contentPages: [], settings: null });

    useEffect(() => {
        const fetchSiteData = async () => {
            try {
                const { data: services, error: servicesError } = await supabase.from('services').select('*').order('created_at').returns<Service[]>();
                if (servicesError) throw servicesError;

                const { data: blogPosts, error: blogError } = await supabase.from('blog_posts').select('*').eq('status', 'Published').order('publish_date', { ascending: false }).returns<BlogPost[]>();
                if (blogError) throw blogError;

                const { data: contentPages, error: pagesError } = await supabase.from('content_pages').select('*').returns<ContentPageType[]>();
                if (pagesError) throw pagesError;

                const { data: settings, error: settingsError } = await supabase.from('site_settings').select('*').limit(1).single<SiteSettings>();
                if (settingsError) throw settingsError;

                setSiteData({ services, blogPosts, contentPages, settings });
            } catch (error) {
                console.error("Failed to fetch public site data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSiteData();
    }, []);

    const renderPage = () => {
        if (!siteData.settings) return null;

        const cleanPath = route.startsWith('#/') ? route : '#/';
        const pathSegments = cleanPath.substring(2).split('/').filter(Boolean);
        const primaryPath = pathSegments[0] || '';
        const slug = pathSegments[1] || '';

        // Handle full pages first
        if (primaryPath === 'services') {
            const service = siteData.services.find(s => s.seo.slug === slug);
            if (service && siteData.settings) {
                const relatedServices = service.related_service_ids
                    ? siteData.services.filter(s => service.related_service_ids.includes(s.id))
                    : [];
                return <ServiceDetailPage service={service} relatedServices={relatedServices} settings={siteData.settings} />;
            }
            return <ServicesPage services={siteData.services} />;
        }

        if (primaryPath === 'blog') {
            const post = siteData.blogPosts.find(p => p.seo.slug === slug);
            if (post) {
                return <BlogDetailPage post={post} />;
            }
            return <BlogPage posts={siteData.blogPosts} />;
        }
        
        if (['about', 'privacy', 'terms'].includes(primaryPath)) {
            const page = siteData.contentPages.find(p => p.id === primaryPath);
            return page ? <ContentPage page={page} /> : <HomePage services={siteData.services} posts={siteData.blogPosts} />; // Fallback to home
        }

        // If none of the above, it's either the homepage or a homepage anchor
        // The primaryPath will be the anchor name (e.g., 'contact', 'gallery')
        // FIX: Pass scrollTo prop to HomePage
        return <HomePage scrollTo={primaryPath} services={siteData.services} posts={siteData.blogPosts} />;
    };

    if (loading) {
        return (
            <div className="bg-brand-dark min-h-screen flex items-center justify-center">
                <Loader />
            </div>
        );
    }
    
    if (!siteData.settings) {
        return (
            <div className="bg-brand-dark min-h-screen flex items-center justify-center text-center text-red-400 p-8">
                <div>
                    <h1 className="text-2xl font-bold mb-4">Failed to Load Website Configuration</h1>
                    <p className="text-gray-300">This usually means the database has not been set up correctly.</p>
                    <p className="text-gray-400 mt-2 text-sm">Please go to your Supabase dashboard's SQL Editor and run the migration script to create the necessary tables and data.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-brand-dark text-brand-light font-sans">
            <Header />
            <main>{renderPage()}</main>
            <Footer settings={siteData.settings} />
            {siteData.settings.whatsapp_number && (
                <a
                    href={`https://wa.me/${siteData.settings.whatsapp_number}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="fixed bottom-6 right-6 bg-green-500 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform z-30"
                    aria-label="Chat on WhatsApp"
                >
                    <WhatsAppIcon />
                </a>
            )}
        </div>
    );
};

export default PublicWebsite;
