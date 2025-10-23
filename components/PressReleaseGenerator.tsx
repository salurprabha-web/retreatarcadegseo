import React, { useState } from 'react';
import { PressRelease } from '../types';
import { generatePressRelease } from '../services/geminiService';
import Card from './common/Card';
import Button from './common/Button';
import TextArea from './common/TextArea';
import Loader from './common/Loader';

const PressReleaseGenerator: React.FC = () => {
    const [announcement, setAnnouncement] = useState('Launch of a new partnership with a luxury hotel chain.');
    const [keyPoints, setKeyPoints] = useState('- Exclusive arcade packages for hotel guests.\n- Features our new Luxe Glow-in-the-Dark Air Hockey.\n- Available starting next month.');
    const [pressRelease, setPressRelease] = useState<PressRelease | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isCopied, setIsCopied] = useState(false);

    const handleGenerate = async () => {
        if (!announcement.trim() || !keyPoints.trim()) {
            setError('Please provide both an announcement topic and key points.');
            return;
        }
        setError('');
        setIsLoading(true);
        setPressRelease(null);
        try {
            const result = await generatePressRelease(announcement, keyPoints);
            setPressRelease(result);
        } catch (err: any) {
            setError(err.message || 'Failed to generate press release.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        if (!pressRelease) return;
        const fullText = [
            'FOR IMMEDIATE RELEASE',
            pressRelease.headline,
            pressRelease.dateline,
            pressRelease.introduction,
            pressRelease.body,
            '###',
            'About Retreat Arcade',
            pressRelease.boilerplate,
            pressRelease.contactInfo
        ].join('\n\n');
        navigator.clipboard.writeText(fullText);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className="p-8 text-brand-light">
            <h1 className="text-4xl font-bold mb-2 font-poppins">AI Press Release Generator</h1>
            <p className="text-gray-400 mb-8">
                Craft professionally formatted press releases for your major announcements.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Controls */}
                <div className="lg:col-span-1">
                    <Card title="1. Announcement Details">
                        <div className="space-y-6">
                            <TextArea
                                label="What is the announcement about?"
                                placeholder="e.g., Launching a new premium service, partnership announcement"
                                value={announcement}
                                onChange={(e) => setAnnouncement(e.target.value)}
                                rows={4}
                            />
                            <TextArea
                                label="Key Information & Talking Points"
                                placeholder="List the essential details, dates, and quotes to include."
                                value={keyPoints}
                                onChange={(e) => setKeyPoints(e.target.value)}
                                rows={6}
                            />
                            <Button onClick={handleGenerate} isLoading={isLoading}>
                                {isLoading ? 'Generating...' : '✨ Generate Press Release'}
                            </Button>
                            {error && <p className="text-red-400 text-sm">{error}</p>}
                        </div>
                    </Card>
                </div>

                {/* Right Column: Results */}
                <div className="lg:col-span-2">
                    <Card title="2. Generated Press Release">
                        {isLoading && (
                            <div className="flex justify-center items-center h-96">
                                <Loader />
                            </div>
                        )}
                        {!isLoading && !pressRelease && (
                            <div className="text-center py-32 text-gray-500">
                                <p>Your generated press release will appear here.</p>
                                <p>Provide your announcement details to get started.</p>
                            </div>
                        )}
                        {pressRelease && (
                            <div>
                                <div className="flex justify-end mb-4">
                                    <button
                                        onClick={handleCopy}
                                        className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white text-sm font-semibold rounded-md transition-colors"
                                    >
                                        {isCopied ? 'Copied!' : 'Copy Full Text'}
                                    </button>
                                </div>
                                <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-4 text-sm text-gray-300 leading-relaxed font-serif">
                                    <h2 className="text-2xl font-bold text-white text-center font-sans">{pressRelease.headline}</h2>
                                    <p className="font-semibold">{pressRelease.dateline}</p>
                                    <p className="italic">{pressRelease.introduction}</p>
                                    <div className="space-y-4 whitespace-pre-wrap">
                                        {pressRelease.body.split('\n').map((paragraph, index) => (
                                            <p key={index}>{paragraph}</p>
                                        ))}
                                    </div>
                                    <div className="text-center pt-4">###</div>
                                    <div>
                                        <h3 className="font-bold text-white mb-2 font-sans">About Retreat Arcade</h3>
                                        <p>{pressRelease.boilerplate}</p>
                                    </div>
                                    <div className="pt-4 border-t border-gray-700">
                                        <h3 className="font-bold text-white mb-2 font-sans">Media Contact</h3>
                                        <p className="whitespace-pre-wrap">{pressRelease.contactInfo}</p>
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

export default PressReleaseGenerator;
