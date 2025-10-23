import React, { useState } from 'react';
import { SocialMediaPost } from '../types';
import { generateSocialMediaPosts } from '../services/geminiService';
import Card from './common/Card';
import Button from './common/Button';
import Input from './common/Input';
import Loader from './common/Loader';
import TextArea from './common/TextArea';

const SocialMediaPostCard: React.FC<{ post: SocialMediaPost }> = ({ post }) => {
    const [isCopied, setIsCopied] = useState(false);
    const handleCopy = () => {
        const fullText = `${post.copy}\n\n${post.hashtags.map(h => `#${h}`).join(' ')}`;
        navigator.clipboard.writeText(fullText);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className="bg-brand-dark p-4 rounded-lg border border-gray-700">
            <div className="flex justify-end mb-2">
                <button
                    onClick={handleCopy}
                    className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs font-semibold rounded-md transition-colors"
                >
                    {isCopied ? 'Copied!' : 'Copy Post'}
                </button>
            </div>
            <p className="text-gray-300 whitespace-pre-wrap mb-4">{post.copy}</p>
            <div className="flex flex-wrap gap-2">
                {post.hashtags.map((tag, index) => (
                    <span key={index} className="bg-gray-700 text-brand-accent text-xs font-medium px-2.5 py-1 rounded-full">
                        #{tag}
                    </span>
                ))}
            </div>
        </div>
    );
};

const SocialMediaPostGenerator: React.FC = () => {
    const [topic, setTopic] = useState('');
    const [platform, setPlatform] = useState('Instagram');
    const [cta, setCta] = useState('');
    const [posts, setPosts] = useState<SocialMediaPost[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!topic.trim()) {
            setError('Please enter a topic for your post.');
            return;
        }
        setError('');
        setIsLoading(true);
        setPosts([]);
        try {
            const result = await generateSocialMediaPosts(topic, platform, cta);
            setPosts(result);
        } catch (err: any) {
            setError(err.message || 'Failed to generate posts.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-8 text-brand-light">
            <h1 className="text-4xl font-bold mb-2 font-poppins">AI Social Media Post Generator</h1>
            <p className="text-gray-400 mb-8">
                Craft engaging social media posts tailored to any platform in seconds.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Controls */}
                <div className="lg:col-span-1 flex flex-col gap-8">
                    <Card title="1. Configure Your Post">
                        <div className="space-y-6">
                            <TextArea
                                label="What is the post about?"
                                placeholder="e.g., Announcing our new retro pinball machine collection."
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                rows={4}
                            />
                            <div>
                                <label htmlFor="platform-select" className="block text-sm font-medium text-gray-300 mb-1">
                                    Social Media Platform
                                </label>
                                <select
                                    id="platform-select"
                                    value={platform}
                                    onChange={(e) => setPlatform(e.target.value)}
                                    className="w-full px-3 py-2 bg-brand-dark text-brand-light border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent"
                                >
                                    <option>Instagram</option>
                                    <option>Facebook</option>
                                    <option>LinkedIn</option>
                                    <option>Twitter/X</option>
                                </select>
                            </div>
                            <Input
                                label="Optional: Call-to-Action (CTA)"
                                placeholder="e.g., Book now, Learn more"
                                value={cta}
                                onChange={(e) => setCta(e.target.value)}
                            />
                            <Button onClick={handleGenerate} isLoading={isLoading}>
                                {isLoading ? 'Generating...' : '✨ Generate Posts'}
                            </Button>
                            {error && <p className="text-red-400 text-sm">{error}</p>}
                        </div>
                    </Card>
                </div>

                {/* Right Column: Results */}
                <div className="lg:col-span-2">
                    <Card title="2. Generated Posts">
                        {isLoading && (
                            <div className="flex justify-center items-center h-96">
                                <Loader />
                            </div>
                        )}
                        {!isLoading && posts.length === 0 && (
                            <div className="text-center py-32 text-gray-500">
                                <p>Your AI-generated posts will appear here.</p>
                                <p>Fill out the form and click "Generate Posts" to start.</p>
                            </div>
                        )}
                        {posts.length > 0 && (
                            <div className="space-y-4">
                                {posts.map((post, index) => (
                                    <SocialMediaPostCard key={index} post={post} />
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default SocialMediaPostGenerator;