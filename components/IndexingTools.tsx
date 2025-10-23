import React, { useState } from 'react';
import { generateRobotsTxt, generateSitemapXml } from '../services/geminiService';
import { supabase } from '../services/supabaseClient';
import { Service, BlogPost, ContentPage } from '../types';
import Card from './common/Card';
import Button from './common/Button';
import Loader from './common/Loader';
import TextArea from './common/TextArea';

const IndexingTools: React.FC = () => {
    const [robotsTxt, setRobotsTxt] = useState('');
    const [sitemapXml, setSitemapXml] = useState('');
    const [isLoading, setIsLoading] = useState<'robots' | 'sitemap' | null>(null);
    const [error, setError] = useState('');
    const [isCopied, setIsCopied] = useState<'robots' | 'sitemap' | null>(null);

    const handleGenerateRobots = async () => {
        setIsLoading('robots');
        setError('');
        try {
            const result = await generateRobotsTxt();
            setRobotsTxt(result);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(null);
        }
    };
    
    const handleGenerateSitemap = async () => {
        setIsLoading('sitemap');
        setError('');
        try {
            // Collect all public URLs from the database
            const { data: services } = await supabase.from('services').select('seo').returns<Pick<Service, 'seo'>[]>();
            const { data: posts } = await supabase.from('blog_posts').select('seo').eq('status', 'Published').returns<Pick<BlogPost, 'seo'>[]>();
            const { data: pages } = await supabase.from('content_pages').select('seo').returns<Pick<ContentPage, 'seo'>[]>();

            const urls = [
                '/',
                '#/services',
                '#/blog',
                ...(services?.map(s => `#/services/${s.seo.slug}`) || []),
                ...(posts?.map(p => `#/blog/${p.seo.slug}`) || []),
                ...(pages?.map(p => `#/${p.seo.slug}`) || []),
            ];

            const result = await generateSitemapXml(urls);
            setSitemapXml(result);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(null);
        }
    };

    const handleCopy = (type: 'robots' | 'sitemap') => {
        const content = type === 'robots' ? robotsTxt : sitemapXml;
        navigator.clipboard.writeText(content);
        setIsCopied(type);
        setTimeout(() => setIsCopied(null), 2000);
    };

    return (
        <div className="p-8 text-brand-light">
            <h1 className="text-4xl font-bold mb-2 font-poppins">Indexing Tools</h1>
            <p className="text-gray-400 mb-8">
                Generate `robots.txt` and `sitemap.xml` files for search engine crawlers.
            </p>

            {error && <p className="text-red-400 bg-red-500/10 p-3 rounded-md mb-6">{error}</p>}
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card title="robots.txt Generator">
                    <p className="text-sm text-gray-400 mb-4">
                        This file tells search engines which pages on your site to crawl. Place the generated file in the root directory of your website.
                    </p>
                    <Button onClick={handleGenerateRobots} isLoading={isLoading === 'robots'} className="w-auto mb-4">
                        {isLoading === 'robots' ? 'Generating...' : '✨ Generate robots.txt'}
                    </Button>
                    {robotsTxt && (
                        <div>
                             <div className="flex justify-end mb-2">
                                <button onClick={() => handleCopy('robots')} className="px-3 py-1 bg-gray-600 text-xs rounded-md">{isCopied === 'robots' ? 'Copied!' : 'Copy'}</button>
                            </div>
                            <TextArea value={robotsTxt} readOnly rows={8} />
                        </div>
                    )}
                </Card>

                <Card title="sitemap.xml Generator">
                     <p className="text-sm text-gray-400 mb-4">
                        This file helps search engines find and understand all the content on your site. Place it in the root directory and submit it via Google Search Console.
                    </p>
                    <Button onClick={handleGenerateSitemap} isLoading={isLoading === 'sitemap'} className="w-auto mb-4">
                        {isLoading === 'sitemap' ? 'Generating...' : '✨ Generate sitemap.xml'}
                    </Button>
                    {sitemapXml && (
                        <div>
                            <div className="flex justify-end mb-2">
                                <button onClick={() => handleCopy('sitemap')} className="px-3 py-1 bg-gray-600 text-xs rounded-md">{isCopied === 'sitemap' ? 'Copied!' : 'Copy'}</button>
                            </div>
                            <TextArea value={sitemapXml} readOnly rows={15} />
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default IndexingTools;