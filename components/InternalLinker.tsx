import React, { useState, useMemo, useEffect } from 'react';
import { InternalLinkSuggestion, Service, BlogPost } from '../types';
import { generateInternalLinks } from '../services/geminiService';
import { supabase } from '../services/supabaseClient';
import Card from './common/Card';
import Button from './common/Button';
import TextArea from './common/TextArea';
import Loader from './common/Loader';

const InternalLinker: React.FC = () => {
    const [content, setContent] = useState('');
    const [suggestions, setSuggestions] = useState<InternalLinkSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [potentialLinks, setPotentialLinks] = useState<{title: string, url: string}[]>([]);

    useEffect(() => {
        const fetchLinks = async () => {
            const { data: services, error: serviceError } = await supabase.from('services').select('name, seo').returns<Pick<Service, 'name' | 'seo'>[]>();
            if (serviceError) console.error(serviceError);

            const { data: posts, error: postError } = await supabase.from('blog_posts').select('title, seo').eq('status', 'Published').returns<Pick<BlogPost, 'title' | 'seo'>[]>();
            if (postError) console.error(postError);
            
            const serviceLinks = services?.map(service => ({
                title: service.name,
                url: `#/services/${service.seo.slug}`
            })) || [];

            const blogLinks = posts?.map(post => ({
                title: post.title,
                url: `#/blog/${post.seo.slug}`
            })) || [];

            setPotentialLinks([...serviceLinks, ...blogLinks]);
        };
        fetchLinks();
    }, []);

    const handleGenerate = async () => {
        if (!content.trim()) {
            setError('Please paste your blog post content first.');
            return;
        }
        if(potentialLinks.length === 0) {
            setError('No potential pages to link to were found. Please add services or blog posts.');
            return;
        }
        setError('');
        setIsLoading(true);
        setSuggestions([]);
        try {
            const result = await generateInternalLinks(content, potentialLinks);
            setSuggestions(result);
        } catch (err: any) {
            setError(err.message || 'Failed to generate link suggestions.');
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="p-8 text-brand-light">
            <h1 className="text-4xl font-bold mb-2 font-poppins">AI Internal Link Assistant</h1>
            <p className="text-gray-400 mb-8">
                Boost your SEO by automatically finding relevant internal linking opportunities in your content.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Input */}
                <div>
                    <Card title="1. Paste Your Content">
                        <div className="space-y-4">
                            <TextArea
                                label="Blog Post Content"
                                placeholder="Paste your full blog post content here..."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                rows={20}
                            />
                            <Button onClick={handleGenerate} isLoading={isLoading}>
                                {isLoading ? 'Analyzing...' : '✨ Find Link Opportunities'}
                            </Button>
                            {error && <p className="text-red-400 mt-2 text-sm">{error}</p>}
                        </div>
                    </Card>
                </div>

                {/* Right Column: Results */}
                <div>
                    <Card title="2. Suggested Internal Links">
                        {isLoading && (
                            <div className="flex justify-center items-center h-96">
                                <Loader />
                            </div>
                        )}

                        {!isLoading && suggestions.length === 0 && (
                            <div className="text-center py-32 text-gray-500">
                                <p>Your link suggestions will appear here.</p>
                                <p>Paste your content and click the button to start.</p>
                            </div>
                        )}

                        {suggestions.length > 0 && (
                            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                                {suggestions.map((suggestion, index) => (
                                    <SuggestionCard key={index} suggestion={suggestion} />
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};


const SuggestionCard: React.FC<{ suggestion: InternalLinkSuggestion }> = ({ suggestion }) => {
    const [isCopied, setIsCopied] = useState(false);
    const markdownLink = `[${suggestion.anchorText}](${suggestion.suggestedUrl})`;

    const handleCopy = () => {
        navigator.clipboard.writeText(markdownLink);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className="bg-brand-dark p-4 rounded-lg border border-gray-700">
            <div className="flex justify-between items-start mb-3">
                 <p className="text-sm text-gray-400 italic">Anchor Text:</p>
                 <button
                    onClick={handleCopy}
                    className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs font-semibold rounded-md transition-colors flex-shrink-0"
                >
                    {isCopied ? 'Copied!' : 'Copy Link'}
                </button>
            </div>
            <p className="font-semibold text-brand-accent bg-brand-accent/10 p-2 rounded-md">
                "{suggestion.anchorText}"
            </p>
            
            <p className="text-sm text-gray-400 mt-3">Links to:</p>
            <a href={suggestion.suggestedUrl} target="_blank" rel="noopener noreferrer" className="text-white font-mono text-sm underline hover:text-brand-accent break-all">
                {suggestion.suggestedUrl}
            </a>

            <p className="text-sm text-gray-400 mt-3">Reason:</p>
            <p className="text-sm text-gray-300">{suggestion.explanation}</p>
        </div>
    );
};

export default InternalLinker;
