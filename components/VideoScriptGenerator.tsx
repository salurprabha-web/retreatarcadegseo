import React, { useState } from 'react';
import { VideoScript } from '../types';
import { generateVideoScript } from '../services/geminiService';
import Card from './common/Card';
import Button from './common/Button';
import Input from './common/Input';
import TextArea from './common/TextArea';
import Loader from './common/Loader';

const VideoScriptGenerator: React.FC = () => {
    const [topic, setTopic] = useState('A 30-second ad for our VR Racing Rig');
    const [style, setStyle] = useState('Instagram Reel');
    const [talkingPoints, setTalkingPoints] = useState('Immersive experience, haptic feedback, perfect for corporate events.');
    const [script, setScript] = useState<VideoScript | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isCopied, setIsCopied] = useState(false);

    const handleGenerate = async () => {
        if (!topic.trim() || !talkingPoints.trim()) {
            setError('Please fill in all fields to generate a script.');
            return;
        }
        setError('');
        setIsLoading(true);
        setScript(null);
        try {
            const result = await generateVideoScript(topic, style, talkingPoints);
            setScript(result);
        } catch (err: any) {
            setError(err.message || 'Failed to generate video script.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCopy = () => {
        if (!script) return;
        const scriptText = `Title: ${script.title}\n\n` +
            script.scenes.map(scene => (
                `Scene ${scene.sceneNumber}\n` +
                `Visual: ${scene.visual}\n` +
                `Voiceover: ${scene.voiceover}\n` +
                (scene.onScreenText ? `On-Screen Text: ${scene.onScreenText}\n` : '')
            )).join('\n');
        navigator.clipboard.writeText(scriptText);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className="p-8 text-brand-light">
            <h1 className="text-4xl font-bold mb-2 font-poppins">AI Video Script Generator</h1>
            <p className="text-gray-400 mb-8">
                Create compelling, ready-to-shoot video scripts for your marketing campaigns.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Controls */}
                <div className="lg:col-span-1">
                    <Card title="1. Script Configuration">
                        <div className="space-y-6">
                            <Input
                                label="Video Topic"
                                placeholder="e.g., A 60s promo for our services"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                            />
                            <div>
                                <label htmlFor="style-select" className="block text-sm font-medium text-gray-300 mb-1">
                                    Video Style / Platform
                                </label>
                                <select
                                    id="style-select"
                                    value={style}
                                    onChange={(e) => setStyle(e.target.value)}
                                    className="w-full px-3 py-2 bg-brand-dark text-brand-light border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent"
                                >
                                    <option>Instagram Reel</option>
                                    <option>YouTube Ad (Skippable)</option>
                                    <option>Corporate Showcase</option>
                                    <option>TikTok Ad</option>
                                    <option>Informative Explainer</option>
                                </select>
                            </div>
                            <TextArea
                                label="Key Talking Points"
                                placeholder="e.g., Highlight our premium quality, show guests having fun, end with a strong CTA."
                                value={talkingPoints}
                                onChange={(e) => setTalkingPoints(e.target.value)}
                                rows={4}
                            />
                            <Button onClick={handleGenerate} isLoading={isLoading}>
                                {isLoading ? 'Generating...' : '✨ Generate Script'}
                            </Button>
                            {error && <p className="text-red-400 text-sm">{error}</p>}
                        </div>
                    </Card>
                </div>

                {/* Right Column: Results */}
                <div className="lg:col-span-2">
                    <Card title="2. Generated Video Script">
                        {isLoading && (
                            <div className="flex justify-center items-center h-96">
                                <Loader />
                            </div>
                        )}
                        {!isLoading && !script && (
                            <div className="text-center py-32 text-gray-500">
                                <p>Your generated video script will appear here.</p>
                                <p>Configure your video details to get started.</p>
                            </div>
                        )}
                        {script && (
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-2xl font-bold text-white font-poppins">{script.title}</h2>
                                    <button
                                        onClick={handleCopy}
                                        className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white text-sm font-semibold rounded-md transition-colors"
                                    >
                                        {isCopied ? 'Copied!' : 'Copy Script'}
                                    </button>
                                </div>
                                <div className="space-y-6 max-h-[65vh] overflow-y-auto pr-4">
                                    {script.scenes.map((scene) => (
                                        <div key={scene.sceneNumber} className="bg-brand-dark p-4 rounded-lg border border-gray-700">
                                            <h3 className="text-lg font-semibold text-brand-accent mb-3">Scene {scene.sceneNumber}</h3>
                                            <div className="space-y-3">
                                                <div>
                                                    <h4 className="font-semibold text-gray-400 text-sm mb-1">VISUAL:</h4>
                                                    <p className="text-gray-300 text-sm">{scene.visual}</p>
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-gray-400 text-sm mb-1">VOICEOVER:</h4>
                                                    <p className="text-gray-300 text-sm italic">"{scene.voiceover}"</p>
                                                </div>
                                                {scene.onScreenText && (
                                                     <div>
                                                        <h4 className="font-semibold text-gray-400 text-sm mb-1">ON-SCREEN TEXT:</h4>
                                                        <p className="text-brand-accent text-sm font-bold bg-black/20 p-2 rounded-md inline-block">{scene.onScreenText}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default VideoScriptGenerator;