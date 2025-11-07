import React, { useState, useEffect } from 'react';
import { ContentPage } from '../types';
import { createClient } from '../lib/supabase/client';
import { generatePageContent, getSeoSuggestions } from '../services/geminiService';
import Card from './common/Card';
import Button from './common/Button';
import Input from './common/Input';
import TextArea from './common/TextArea';
import Loader from './common/Loader';

// Fix: Instantiate Supabase client
const supabase = createClient();

interface PageManagerProps {
    showToast: (message: string, type: 'success' | 'error') => void;
}

const PageManager: React.FC<PageManagerProps> = ({ showToast }) => {
    const [pages, setPages] = useState<ContentPage[]>([]);
    const [selectedPageId, setSelectedPageId] = useState<ContentPage['id'] | ''>('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    
    useEffect(() => {
        const fetchPages = async () => {
            setIsLoading(true);
            const { data, error } = await supabase.from('content_pages').select('*').returns<ContentPage[]>();
            if (error) {
                showToast('Could not fetch content pages.', 'error');
            } else {
                setPages(data || []);
                if (data && data.length > 0) {
                    setSelectedPageId(data[0].id);
                }
            }
            setIsLoading(false);
        };
        fetchPages();
    }, [showToast]);

    const selectedPage = pages.find(p => p.id === selectedPageId);

    const handlePageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedPageId(e.target.value as ContentPage['id']);
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const updatedPages = pages.map(page => {
            if (page.id === selectedPageId) {
                if (name.startsWith('seo.')) {
                    const seoField = name.split('.')[1];
                    return { ...page, seo: { ...page.seo, [seoField]: value } };
                }
                return { ...page, [name]: value };
            }
            return page;
        });
        setPages(updatedPages);
    };

    const handleGenerateContent = async () => {
        if (!selectedPage) return;
        setIsLoading(true);
        setError('');
        try {
            const content = await generatePageContent(selectedPage.title);
            const updatedPages = pages.map(p => p.id === selectedPageId ? { ...p, content } : p);
            setPages(updatedPages);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleGenerateSeo = async () => {
        if (!selectedPage || !selectedPage.content) {
            setError("Please generate or write content before optimizing SEO.");
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            const suggestions = await getSeoSuggestions(selectedPage.content, selectedPage.title);
            const updatedPages = pages.map(p => {
                if (p.id === selectedPageId) {
                    return {
                        ...p,
                        seo: {
                            ...p.seo,
                            metaTitle: suggestions.title,
                            metaDescription: suggestions.description,
                        }
                    };
                }
                return p;
            });
            setPages(updatedPages);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!selectedPage) return;
        setIsSaving(true);
        const { error } = await supabase.from('content_pages').update(selectedPage).eq('id', selectedPage.id);
        if (error) {
            showToast(`Failed to save page: ${error.message}`, 'error');
        } else {
            showToast(`Page "${selectedPage.title}" saved successfully.`, 'success');
        }
        setIsSaving(false);
    };

    if (isLoading && pages.length === 0) {
        return <div className="p-8 flex justify-center"><Loader /></div>;
    }
    
    return (
        <div className="p-8 text-brand-light">
            <h1 className="text-4xl font-bold mb-2 font-poppins">Pages Manager</h1>
            <p className="text-gray-400 mb-8">
                Edit content and SEO for your static pages like About Us, Privacy Policy, etc.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <Card title="Select Page to Edit">
                        <select
                            value={selectedPageId}
                            onChange={handlePageChange}
                            className="w-full px-3 py-2 bg-brand-dark text-brand-light border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent"
                        >
                            {pages.map(page => (
                                <option key={page.id} value={page.id}>{page.title}</option>
                            ))}
                        </select>
                    </Card>
                     <div className="mt-8">
                        <Card title="AI Content Tools">
                             <div className="space-y-4">
                                <Button onClick={handleGenerateContent} isLoading={isLoading}>
                                    {isLoading ? 'Generating...' : '✨ Generate Page Content'}
                                </Button>
                                <Button onClick={handleGenerateSeo} isLoading={isLoading} className="bg-gray-600 hover:bg-gray-500">
                                    {isLoading ? 'Optimizing...' : '✨ Optimize SEO'}
                                </Button>
                                {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                             </div>
                        </Card>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    {selectedPage && (
                        <Card title={`Editing: ${selectedPage.title}`}>
                            {(isLoading || isSaving) && <div className="absolute inset-0 bg-brand-secondary/50 flex justify-center items-center z-10"><Loader /></div>}
                            <div className="space-y-6">
                                <Input label="Page Title" name="title" value={selectedPage.title} onChange={handleInputChange} />
                                <TextArea label="Page Content (Markdown)" name="content" value={selectedPage.content} onChange={handleInputChange} rows={15} />
                                
                                <h3 className="text-lg font-semibold text-gray-200 pt-4 border-t border-gray-700">SEO Settings</h3>
                                <Input label="Meta Title" name="seo.metaTitle" value={selectedPage.seo.metaTitle} onChange={handleInputChange} maxLength={60} showCharCount />
                                <TextArea label="Meta Description" name="seo.metaDescription" value={selectedPage.seo.metaDescription} onChange={handleInputChange} rows={3} maxLength={160} showCharCount />
                                <Input label="URL Slug" name="seo.slug" value={selectedPage.seo.slug} onChange={handleInputChange} disabled />
                            </div>
                        </Card>
                    )}
                </div>
            </div>
             <div className="flex justify-end mt-8">
                <Button onClick={handleSave} className="w-auto" isLoading={isSaving}>Save Changes</Button>
            </div>
        </div>
    );
};

export default PageManager;