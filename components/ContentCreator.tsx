import React, { useState, useMemo } from 'react';
import Card from './common/Card';
import Button from './common/Button';
import Input from './common/Input';
import TextArea from './common/TextArea';
import Loader from './common/Loader';
import { generateBlogPost } from '../services/geminiService';

const ContentCreator: React.FC = () => {
    const [topic, setTopic] = useState('');
    const [tone, setTone] = useState('Professional');
    const [generatedContent, setGeneratedContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isCopied, setIsCopied] = useState(false);

    const handleGenerate = async () => {
        if (!topic.trim()) {
            setError('Please enter a topic to generate content.');
            return;
        }
        setError('');
        setIsLoading(true);
        setGeneratedContent('');
        try {
            const content = await generateBlogPost(topic, tone);
            setGeneratedContent(content);
        } catch (err: any) {
            setError(err.message || 'Failed to generate content.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCopy = () => {
        if (!generatedContent) return;
        navigator.clipboard.writeText(generatedContent);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const wordCount = useMemo(() => {
        if (!generatedContent) return 0;
        return generatedContent.trim().split(/\s+/).length;
    }, [generatedContent]);

    return (
        <div className="p-8 text-brand-light">
            <h1 className="text-4xl font-bold mb-2 font-poppins">AI Content Creator</h1>
            <p className="text-gray-400 mb-8">
                Generate high-quality, SEO-friendly blog posts and articles in seconds.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Controls */}
                <div className="lg:col-span-1">
                    <Card title="1. Configure Your Article">
                        <div className="space-y-6">
                            <Input
                                label="Blog Post Topic or Keywords"
                                placeholder="e.g., Top 5 Arcade Games for Weddings"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                            />
                            <div>
                                <label htmlFor="tone-select" className="block text-sm font-medium text-gray-300 mb-1">
                                    Tone of Voice
                                </label>
                                <select
                                    id="tone-select"
                                    value={tone}
                                    onChange={(e) => setTone(e.target.value)}
                                    className="w-full px-3 py-2 bg-brand-dark text-brand-light border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent"
                                >
                                    <option>Professional</option>
                                    <option>Casual</option>
                                    <option>Exciting</option>
                                    <option>Luxurious</option>
                                    <option>Informative</option>
                                </select>
                            </div>
                            <Button onClick={handleGenerate} isLoading={isLoading}>
                                {isLoading ? 'Generating...' : '✨ Generate Content'}
                            </Button>
                            {error && <p className="text-red-400 text-sm">{error}</p>}
                        </div>
                    </Card>
                </div>

                {/* Right Column: Results */}
                <div className="lg:col-span-2">
                    <Card title="2. Generated Content">
                        {isLoading && (
                            <div className="flex justify-center items-center h-96">
                                <Loader />
                            </div>
                        )}
                        {!isLoading && !generatedContent && (
                            <div className="text-center py-32 text-gray-500">
                                <p>Your generated article will appear here.</p>
                                <p>Enter a topic and click "Generate Content" to start.</p>
                            </div>
                        )}
                        {generatedContent && (
                             <div>
                                <div className="flex justify-end items-center mb-2 gap-4">
                                    <span className="text-sm text-gray-400">{wordCount} words</span>
                                    <button
                                        onClick={handleCopy}
                                        className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs font-semibold rounded-md transition-colors"
                                    >
                                        {isCopied ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                                <TextArea
                                    value={generatedContent}
                                    onChange={(e) => setGeneratedContent(e.target.value)}
                                    className="min-h-[60vh] font-mono text-sm"
                                    placeholder="Generated content..."
                                    rows={25}
                                />
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ContentCreator;
