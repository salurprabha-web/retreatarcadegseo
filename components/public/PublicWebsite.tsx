import React, { useState, useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import HomePage from './HomePage';
import ServicesPage from './ServicesPage';
import ServiceDetailPage from './ServiceDetailPage';
import BlogPage from './BlogPage';
import BlogDetailPage from './BlogDetailPage';
import ContentPage from './ContentPage';
import Loader from '../common/Loader';

import { createClient } from '../../lib/supabase/client';
import { SiteSettings, Service, BlogPost, ContentPage as ContentPageType } from '../../types';

const WhatsAppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99 0-3.903-.52-5.687-1.475L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.433-9.89-9.889-9.89-5.452 0-9.887 4.434-9.889 9.891.001 2.23.652 4.395 1.846 6.233l-.985 3.638 3.732-.986zm-1.57-2.97-.57-.34c-1.423-.85-2.822-2.12-3.86-3.626l-.23-.36.004-.36c.004-3.303 2.699-5.999 6.005-5.999 1.58 0 3.061.624 4.159 1.722l.123.123c1.099 1.098 1.718 2.575 1.719 4.153.002 3.303-2.698 5.999-6.004 5.999-1.334 0-2.62-.423-3.692-1.22l-.24-.179z"/></svg>
);


interface PublicWebsiteProps {
    path: string;
}

const PublicWebsite: React.FC<PublicWebsiteProps> = ({ path }) => {
    const supabase = createClient();
    const [settings, setSettings] = useState<SiteSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            const { data, error } = await supabase.from('site_settings').select('*').limit(1).single<SiteSettings>();
            if (error) {
                setError(error.message || "Site settings could not be found.");
            } else {
                setSettings(data);
            }
            setLoading(false);
        };
        fetchSettings();
    }, []);

    const renderContent = () => {
        if (path === '/') return <HomePage />;
        if (path === '/services') return <ServicesPageLoader />;
        if (path.startsWith('/services/')) {
            const slug = path.split('/')[2];
            return <ServiceDetailPageLoader slug={slug} settings={settings!} />;
        }
        if (path === '/blog') return <BlogPageLoader />;
        if (path.startsWith('/blog/')) {
            const slug = path.split('/')[2];
            return <BlogDetailPageLoader slug={slug} />;
        }
        // This handles /about, /privacy, etc.
        if (path.length > 1 && !path.includes('/', 1)) {
            const slug = path.substring(1);
            return <ContentPageLoader slug={slug} />;
        }
        return <HomePage />; // Fallback to homepage
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader /></div>;
    }

    if (error || !settings) {
        return (
            <div className="bg-brand-dark min-h-screen flex items-center justify-center text-center text-red-400 p-8">
                <div>
                    <h1 className="text-2xl font-bold mb-4">Failed to Load Website Configuration</h1>
                    <p className="text-gray-300">{error}</p>
                    <p className="text-gray-400 mt-2 text-sm">Please go to your Supabase dashboard's SQL Editor and run the migration script to create the necessary tables and data.</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="bg-brand-dark text-brand-light font-sans">
            <Header />
            <main>{renderContent()}</main>
            <Footer settings={settings} />
            {settings.whatsapp_number && (
                <a
                    href={`https://wa.me/${settings.whatsapp_number}`}
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

// Data-loading wrapper components
const ServicesPageLoader: React.FC = () => {
    const [services, setServices] = useState<Service[]>([]);
    useEffect(() => {
        const fetchServices = async () => {
            const { data } = await createClient().from('services').select('*').order('created_at').returns<Service[]>();
            setServices(data || []);
        };
        fetchServices();
    }, []);
    return <ServicesPage services={services} />;
};

const ServiceDetailPageLoader: React.FC<{ slug: string, settings: SiteSettings }> = ({ slug, settings }) => {
    const [service, setService] = useState<Service | null>(null);
    const [relatedServices, setRelatedServices] = useState<Service[]>([]);
    useEffect(() => {
        const fetchService = async () => {
            const { data: serviceData } = await createClient().from('services').select('*').eq('seo->>slug', slug).single<Service>();
            if (serviceData) {
                setService(serviceData);
                const relatedIds = serviceData.related_service_ids || [];
                if (relatedIds.length > 0) {
                     const { data: relatedData } = await createClient().from('services').select('*').in('id', relatedIds).returns<Service[]>();
                     setRelatedServices(relatedData || []);
                }
            }
        };
        fetchService();
    }, [slug]);
    if (!service) return <div className="min-h-screen flex items-center justify-center"><Loader /></div>;
    return <ServiceDetailPage service={service} relatedServices={relatedServices} settings={settings} />;
};

const BlogPageLoader: React.FC = () => {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    useEffect(() => {
        const fetchPosts = async () => {
            const { data } = await createClient().from('blog_posts').select('*').eq('status', 'Published').order('publish_date', { ascending: false }).returns<BlogPost[]>();
            setPosts(data || []);
        };
        fetchPosts();
    }, []);
    return <BlogPage posts={posts} />;
};

const BlogDetailPageLoader: React.FC<{ slug: string }> = ({ slug }) => {
    const [post, setPost] = useState<BlogPost | null>(null);
    useEffect(() => {
        const fetchPost = async () => {
            const { data } = await createClient().from('blog_posts').select('*').eq('seo->>slug', slug).eq('status', 'Published').single<BlogPost>();
            setPost(data);
        };
        fetchPost();
    }, [slug]);
    if (!post) return <div className="min-h-screen flex items-center justify-center"><Loader /></div>;
    return <BlogDetailPage post={post} />;
};

const ContentPageLoader: React.FC<{ slug: string }> = ({ slug }) => {
    const [page, setPage] = useState<ContentPageType | null>(null);
    useEffect(() => {
        const fetchPage = async () => {
            const { data } = await createClient().from('content_pages').select('*').eq('seo->>slug', slug).single<ContentPageType>();
            setPage(data);
        };
        fetchPage();
    }, [slug]);
    if (!page) return <div className="min-h-screen flex items-center justify-center"><p>Page not found.</p></div>;
    return <ContentPage page={page} />;
};


export default PublicWebsite;