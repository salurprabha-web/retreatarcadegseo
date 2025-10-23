
import React, { useState } from 'react';
import { BrandKit } from '../types';
import { generateBrandKit } from '../services/geminiService';
import Card from './common/Card';
import Button from './common/Button';
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

const BrandKitManager: React.FC = () => {
    const [description, setDescription] = useState('Retreat Arcade is a luxury event rental company specializing in high-end, modern arcade games and interactive experiences for corporate events, weddings, and exclusive parties. The brand aims to be sophisticated, exclusive, and exciting.');
    const [brandKit, setBrandKit] = useState<BrandKit | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!description.trim()) {
            setError('Please provide a business description.');
            return;
        }
        setError('');
        setIsLoading(true);
        setBrandKit(null);
        try {
            const result = await generateBrandKit(description);
            setBrandKit(result);
        } catch (err: any) {
            setError(err.message || 'Failed to generate brand kit.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-8 text-brand-light">
            <h1 className="text-4xl font-bold mb-2 font-poppins">AI Brand Kit Manager</h1>
            <p className="text-gray-400 mb-8">
                Define and generate your core brand identity with the power of AI.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Input */}
                <div className="lg:col-span-1">
                    <Card title="1. Define Your Business">
                        <div className="space-y-4">
                            <TextArea
                                label="Business Description"
                                placeholder="Describe your business, target audience, and brand goals..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={10}
                            />
                            <Button onClick={handleGenerate} isLoading={isLoading}>
                                {isLoading ? 'Generating...' : '✨ Generate Brand Kit'}
                            </Button>
                            {error && <p className="text-red-400 mt-2 text-sm">{error}</p>}
                        </div>
                    </Card>
                </div>

                {/* Right Column: Results */}
                <div className="lg:col-span-2">
                    <Card title="2. Your AI-Generated Brand Kit">
                        {isLoading && (
                            <div className="flex justify-center items-center h-96">
                                <Loader />
                            </div>
                        )}

                        {!isLoading && !brandKit && (
                            <div className="text-center py-32 text-gray-500">
                                <p>Your complete brand kit will appear here.</p>
                                <p>Describe your business to get started.</p>
                            </div>
                        )}

                        {brandKit && (
                            <div className="space-y-6">
                                {/* Mission Statement */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="text-lg font-semibold text-gray-200">Mission Statement</h3>
                                        <CopyButton text={brandKit.missionStatement} />
                                    </div>
                                    <p className="p-3 bg-brand-dark rounded-md text-gray-300 italic">"{brandKit.missionStatement}"</p>
                                </div>

                                {/* Brand Voice */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="text-lg font-semibold text-gray-200">Brand Voice & Tone</h3>
                                        <CopyButton text={brandKit.brandVoice} />
                                    </div>
                                    <p className="p-3 bg-brand-dark rounded-md text-gray-300">{brandKit.brandVoice}</p>
                                </div>
                                
                                {/* Core Values & Taglines */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <h3 className="text-lg font-semibold text-gray-200">Core Values</h3>
                                            <CopyButton text={brandKit.coreValues.join('\n')} />
                                        </div>
                                        <ul className="space-y-2">
                                            {brandKit.coreValues.map((value, i) => (
                                                <li key={i} className="p-2 bg-brand-dark rounded-md text-gray-300">{value}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <h3 className="text-lg font-semibold text-gray-200">Taglines</h3>
                                            <CopyButton text={brandKit.taglines.join('\n')} />
                                        </div>
                                        <ul className="space-y-2">
                                            {brandKit.taglines.map((tagline, i) => (
                                                <li key={i} className="p-2 bg-brand-dark rounded-md text-gray-300">{tagline}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                {/* Color Palette */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-200 mb-2">Color Palette</h3>
                                    <div className="space-y-3">
                                        {brandKit.colorPalette.map(color => (
                                            <div key={color.hex} className="flex items-center p-3 bg-brand-dark rounded-md">
                                                <div className="w-10 h-10 rounded-full mr-4 border-2 border-gray-600" style={{ backgroundColor: color.hex }}></div>
                                                <div className="flex-1">
                                                    <div className="flex items-baseline">
                                                        <p className="font-semibold text-white">{color.name}</p>
                                                        <p className="ml-2 text-sm text-gray-400 font-mono">{color.hex}</p>
                                                    </div>
                                                    <p className="text-sm text-gray-400">{color.description}</p>
                                                </div>
                                            </div>
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

export default BrandKitManager;
