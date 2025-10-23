import React, { useState } from 'react';
import { AdCopy } from '../types';
import { generateAdCopy } from '../services/geminiService';
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

const AdCopyList: React.FC<{ title: string; items: string[] }> = ({ title, items }) => (
    <div>
        <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-gray-200">{title}</h3>
            <CopyButton text={items.join('\n')} />
        </div>
        <ul className="space-y-2">
            {items.map((item, i) => (
                <li key={i} className="p-3 bg-brand-dark rounded-md text-gray-300 text-sm">
                    {item}
                </li>
            ))}
        </ul>
    </div>
);

const AdCopyGenerator: React.FC = () => {
    const [product, setProduct] = useState('Neo-Tokyo VR Racing Rig');
    const [talkingPoints, setTalkingPoints] = useState('Immersive haptic feedback, perfect for corporate events, creates unforgettable experiences.');
    const [platform, setPlatform] = useState<'Google Ads' | 'Facebook/Instagram Ads'>('Google Ads');
    const [audience, setAudience] = useState('Event planners in Los Angeles');
    const [adCopy, setAdCopy] = useState<AdCopy | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!product.trim() || !talkingPoints.trim() || !audience.trim()) {
            setError('Please fill in all fields to generate ad copy.');
            return;
        }
        setError('');
        setIsLoading(true);
        setAdCopy(null);
        try {
            const result = await generateAdCopy(product, talkingPoints, platform, audience);
            setAdCopy(result);
        } catch (err: any) {
            setError(err.message || 'Failed to generate ad copy.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-8 text-brand-light">
            <h1 className="text-4xl font-bold mb-2 font-poppins">AI Ad Copy Generator</h1>
            <p className="text-gray-400 mb-8">
                Create high-converting ad copy for Google and Facebook in seconds.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Controls */}
                <div className="lg:col-span-1">
                    <Card title="1. Configure Your Ad">
                        <div className="space-y-6">
                            <Input
                                label="Product/Service to Promote"
                                value={product}
                                onChange={(e) => setProduct(e.target.value)}
                            />
                            <TextArea
                                label="Key Talking Points"
                                value={talkingPoints}
                                onChange={(e) => setTalkingPoints(e.target.value)}
                                rows={4}
                            />
                             <Input
                                label="Target Audience"
                                placeholder="e.g., Marketing managers at tech companies"
                                value={audience}
                                onChange={(e) => setAudience(e.target.value)}
                            />
                             <div>
                                <label htmlFor="platform-select" className="block text-sm font-medium text-gray-300 mb-1">
                                    Ad Platform
                                </label>
                                <select
                                    id="platform-select"
                                    value={platform}
                                    onChange={(e) => setPlatform(e.target.value as any)}
                                    className="w-full px-3 py-2 bg-brand-dark text-brand-light border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent"
                                >
                                    <option>Google Ads</option>
                                    <option>Facebook/Instagram Ads</option>
                                </select>
                            </div>
                            <Button onClick={handleGenerate} isLoading={isLoading}>
                                {isLoading ? 'Generating...' : '✨ Generate Ad Copy'}
                            </Button>
                            {error && <p className="text-red-400 text-sm">{error}</p>}
                        </div>
                    </Card>
                </div>

                {/* Right Column: Results */}
                <div className="lg:col-span-2">
                    <Card title="2. AI-Generated Ad Copy">
                        {isLoading && (
                            <div className="flex justify-center items-center h-96">
                                <Loader />
                            </div>
                        )}
                        {!isLoading && !adCopy && (
                            <div className="text-center py-32 text-gray-500">
                                <p>Your generated ad copy will appear here.</p>
                                <p>Fill out the form and click "Generate Ad Copy" to start.</p>
                            </div>
                        )}

                        {adCopy?.googleAds && platform === 'Google Ads' && (
                            <div className="space-y-6">
                                <AdCopyList title="Headlines (Max 30 Chars)" items={adCopy.googleAds.headlines} />
                                <AdCopyList title="Descriptions (Max 90 Chars)" items={adCopy.googleAds.descriptions} />
                            </div>
                        )}

                        {adCopy?.facebookAds && platform === 'Facebook/Instagram Ads' && (
                            <div className="space-y-6">
                                <AdCopyList title="Primary Text" items={adCopy.facebookAds.primaryTexts} />
                                <AdCopyList title="Headlines" items={adCopy.facebookAds.headlines} />
                                <AdCopyList title="Call to Action Suggestions" items={adCopy.facebookAds.ctaSuggestions} />
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default AdCopyGenerator;