import React, { useState } from 'react';
import { LocalSeoCopy } from '../types';
import { generateLocalSeoCopy } from '../services/geminiService';
import Card from './common/Card';
import Button from './common/Button';
import Input from './common/Input';
import TextArea from './common/TextArea';
import Loader from './common/Loader';

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
    const [isCopied, setIsCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };
    return (
        <button
            onClick={handleCopy}
            className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs font-semibold rounded-md transition-colors"
        >
            {isCopied ? 'Copied!' : 'Copy'}
        </button>
    );
};

const LocalSeoManager: React.FC = () => {
    const [targetLocation, setTargetLocation] = useState('Beverly Hills');
    const [services, setServices] = useState('VR Racing Rigs, Luxury Air Hockey, Retro Arcade Machines');
    const [localSeoCopy, setLocalSeoCopy] = useState<LocalSeoCopy | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!targetLocation.trim() || !services.trim()) {
            setError('Please provide a target location and a list of services.');
            return;
        }
        setError('');
        setIsLoading(true);
        setLocalSeoCopy(null);
        try {
            const result = await generateLocalSeoCopy(targetLocation, services);
            setLocalSeoCopy(result);
        } catch (err: any) {
            setError(err.message || 'Failed to generate local SEO content.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-8 text-brand-light">
            <h1 className="text-4xl font-bold mb-2 font-poppins">AI Local SEO Manager</h1>
            <p className="text-gray-400 mb-8">
                Generate optimized content to dominate local search results.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Input */}
                <div className="lg:col-span-1">
                    <Card title="1. Define Your Target">
                        <div className="space-y-4">
                            <Input
                                label="Target City or Region"
                                placeholder="e.g., Los Angeles"
                                value={targetLocation}
                                onChange={(e) => setTargetLocation(e.target.value)}
                            />
                            <TextArea
                                label="Your Core Services (comma-separated)"
                                placeholder="e.g., VR Experiences, Modern Classics, Retro Arcades"
                                value={services}
                                onChange={(e) => setServices(e.target.value)}
                                rows={5}
                            />
                            <Button onClick={handleGenerate} isLoading={isLoading}>
                                {isLoading ? 'Generating...' : '✨ Generate Local Content'}
                            </Button>
                            {error && <p className="text-red-400 mt-2 text-sm">{error}</p>}
                        </div>
                    </Card>
                </div>

                {/* Right Column: Results */}
                <div className="lg:col-span-2">
                     <Card title="2. Your AI-Generated Local SEO Content">
                        {isLoading && (
                            <div className="flex justify-center items-center h-96">
                                <Loader />
                            </div>
                        )}

                        {!isLoading && !localSeoCopy && (
                            <div className="text-center py-32 text-gray-500">
                                <p>Your localized content will appear here.</p>
                                <p>Define your target area and services to begin.</p>
                            </div>
                        )}
                        
                        {localSeoCopy && (
                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="text-lg font-semibold text-gray-200">Google Business Profile Description</h3>
                                        <CopyButton text={localSeoCopy.gbpDescription} />
                                    </div>
                                    <p className="p-3 bg-brand-dark rounded-md text-gray-300 text-sm">{localSeoCopy.gbpDescription}</p>
                                </div>
                                
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-200 mb-2">Example Google Business Posts</h3>
                                    <div className="space-y-3">
                                        {localSeoCopy.gbpPosts.map((post, i) => (
                                            <div key={i} className="p-3 bg-brand-dark rounded-md border border-gray-700">
                                                <div className="flex justify-between items-center mb-2">
                                                    <h4 className="font-semibold text-brand-light">{post.title}</h4>
                                                    <CopyButton text={`${post.title}\n\n${post.content}`} />
                                                </div>
                                                <p className="text-sm text-gray-400">{post.content}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="text-lg font-semibold text-gray-200">Local Landing Page Intro</h3>
                                        <CopyButton text={localSeoCopy.landingPageIntro} />
                                    </div>
                                    <p className="p-3 bg-brand-dark rounded-md text-gray-300 text-sm">{localSeoCopy.landingPageIntro}</p>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="text-lg font-semibold text-gray-200">Local Keyword Ideas</h3>
                                        <CopyButton text={localSeoCopy.localKeywords.join('\n')} />
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {localSeoCopy.localKeywords.map((kw, i) => (
                                            <span key={i} className="bg-gray-700 text-brand-light text-xs font-medium px-2.5 py-1 rounded-full">{kw}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default LocalSeoManager;
