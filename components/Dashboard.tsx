'use client';
import React, { useState, useEffect } from 'react';
import Card from './common/Card';
import Button from './common/Button';
import { NAV_ITEMS } from '../constants';
import { getSimpleSeoScore } from '../utils/seo';
import { Service, GalleryImage, Testimonial } from '../types';
import Loader from './common/Loader';
import { createClient } from '@/lib/supabase/client';
import { getSlugByName } from '@/lib/admin-pages';

const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string | number }> = ({ icon, title, value }) => (
  <div className="bg-brand-secondary p-6 rounded-lg shadow-lg flex items-center">
    <div className="bg-brand-dark p-3 rounded-full mr-4">
      <span className="text-brand-accent">{icon}</span>
    </div>
    <div>
      <p className="text-sm text-gray-400 font-medium uppercase tracking-wider">{title}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
    const [stats, setStats] = useState({
        totalServices: 0,
        totalImages: 0,
        totalTestimonials: 0,
        averageSeoScore: 0
    });
    const [recentActivity, setRecentActivity] = useState<{ type: string; text: string; icon: React.ReactNode }[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();
    
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const servicesPromise = supabase.from('services').select('*').returns<Service[]>();
                const imagesPromise = supabase.from('gallery_images').select('id, title').order('created_at', { ascending: false }).limit(1).returns<Pick<GalleryImage, 'id' | 'title'>[]>();
                const testimonialsPromise = supabase.from('testimonials').select('id, client_name').order('created_at', { ascending: false }).limit(1).returns<Pick<Testimonial, 'id' | 'client_name'>[]>();
                const servicesCountPromise = supabase.from('services').select('*', { count: 'exact', head: true });
                const imagesCountPromise = supabase.from('gallery_images').select('*', { count: 'exact', head: true });
                const testimonialsCountPromise = supabase.from('testimonials').select('*', { count: 'exact', head: true });

                const [
                    { data: services, error: servicesError },
                    { data: images, error: imagesError },
                    { data: testimonials, error: testimonialsError },
                    { count: servicesCount },
                    { count: imagesCount },
                    { count: testimonialsCount },
                ] = await Promise.all([
                    servicesPromise,
                    imagesPromise,
                    testimonialsPromise,
                    servicesCountPromise,
                    imagesCountPromise,
                    testimonialsCountPromise
                ]);

                if (servicesError) throw servicesError;
                if (imagesError) throw imagesError;
                if (testimonialsError) throw testimonialsError;

                const averageSeoScore = services && services.length > 0 
                    ? Math.round(services.reduce((acc, service) => acc + getSimpleSeoScore(service), 0) / services.length)
                    : 0;

                setStats({
                    totalServices: servicesCount || 0,
                    totalImages: imagesCount || 0,
                    totalTestimonials: testimonialsCount || 0,
                    averageSeoScore
                });

                const activity = [];
                if (testimonials && testimonials[0]) {
                    activity.push({ type: 'Testimonial', text: `New review from ${testimonials[0].client_name}`, icon: NAV_ITEMS.find(i => i.name === 'Testimonials')?.icon });
                }
                if (images && images[0]) {
                     activity.push({ type: 'Gallery', text: `Image "${images[0].title}" added`, icon: NAV_ITEMS.find(i => i.name === 'Gallery')?.icon});
                }
                if (services && services.length > 0) {
                     activity.push({ type: 'Service', text: `Service "${services[0].name}" updated`, icon: NAV_ITEMS.find(i => i.name === 'Services')?.icon });
                }
                setRecentActivity(activity);

            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return <div className="p-8 flex justify-center items-center h-full"><Loader /></div>;
    }

    return (
        <div className="p-8 text-brand-light">
        <div className="bg-brand-secondary rounded-lg shadow-lg p-8 mb-8 flex justify-between items-center">
            <div>
                <h1 className="text-4xl font-bold font-poppins">Welcome back, Admin!</h1>
                <p className="text-gray-400 mt-2">Here's a snapshot of your website's performance and content.</p>
            </div>
            <a href={`#/admin/${getSlugByName('SEO Optimizer')}`}>
                <Button className="w-auto">
                    Optimize SEO
                </Button>
            </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            <StatCard icon={NAV_ITEMS.find(i => i.name === 'Services')?.icon} title="Total Services" value={stats.totalServices} />
            <StatCard icon={NAV_ITEMS.find(i => i.name === 'Gallery')?.icon} title="Gallery Images" value={stats.totalImages} />
            <StatCard icon={NAV_ITEMS.find(i => i.name === 'Testimonials')?.icon} title="Total Testimonials" value={stats.totalTestimonials} />
            <StatCard icon={NAV_ITEMS.find(i => i.name === 'SEO Optimizer')?.icon} title="Avg. SEO Score" value={`${stats.averageSeoScore}%`} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card title="Recent Activity">
                {recentActivity.length > 0 ? (
                    <ul className="space-y-4">
                        {recentActivity.map((activity, index) => (
                            <li key={index} className="flex items-center p-3 bg-brand-dark rounded-md">
                                <span className="mr-4 text-brand-light">{activity.icon}</span>
                                <div>
                                    <p className="font-medium text-gray-300">{activity.text}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : <p className="text-gray-500 text-center py-8">No recent activity to show.</p>}
            </Card>
            <Card title="Quick Links">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {['Services', 'Gallery', 'Testimonials', 'Site Settings'].map(page => (
                        <a
                            key={page}
                            href={`#/admin/${getSlugByName(page)}`}
                            className="flex items-center p-4 bg-brand-dark rounded-md hover:bg-gray-800 transition-colors text-left w-full"
                        >
                            <span className="mr-3 text-brand-accent">{NAV_ITEMS.find(i => i.name === page)?.icon}</span>
                            <span className="font-semibold">{page}</span>
                        </a>
                    ))}
                </div>
            </Card>
        </div>
        </div>
    );
};

export default Dashboard;
