import React, { useState, useEffect, useRef } from 'react';
import { generateVideo, getVideoOperation } from '../services/geminiService';
import Card from './common/Card';
import Button from './common/Button';
import Input from './common/Input';
import Loader from './common/Loader';

// Extend the Window interface to include aistudio properties
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

const loadingMessages = [
    "Warming up the digital director's chair...",
    "Assembling pixels into a masterpiece...",
    "Choreographing the dance of light and shadow...",
    "Teaching virtual actors their lines...",
    "Rendering your vision, frame by frame...",
    "This can take a few minutes, perfection is worth the wait!",
];

const VideoGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState('A neon hologram of a cat driving a sports car at top speed');
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [hasApiKey, setHasApiKey] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);

    const pollIntervalRef = useRef<number | null>(null);

    const checkApiKey = async () => {
        if (window.aistudio) {
            const keyStatus = await window.aistudio.hasSelectedApiKey();
            setHasApiKey(keyStatus);
        }
    };

    useEffect(() => {
        checkApiKey();
        
        // Cleanup polling on component unmount
        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
        };
    }, []);

    useEffect(() => {
        let messageInterval: number;
        if (isLoading) {
            messageInterval = window.setInterval(() => {
                setLoadingMessage(prev => {
                    const currentIndex = loadingMessages.indexOf(prev);
                    const nextIndex = (currentIndex + 1) % loadingMessages.length;
                    return loadingMessages[nextIndex];
                });
            }, 4000);
        }
        return () => clearInterval(messageInterval);
    }, [isLoading]);
    
    const handleSelectKey = async () => {
        if (window.aistudio) {
            await window.aistudio.openSelectKey();
            // Assume key selection is successful and optimistically update the UI
            setHasApiKey(true);
        }
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Please enter a prompt to generate a video.');
            return;
        }
        setError('');
        setIsLoading(true);
        setVideoUrl(null);

        try {
            let operation = await generateVideo(prompt, aspectRatio);

            pollIntervalRef.current = window.setInterval(async () => {
                try {
                    operation = await getVideoOperation(operation);
                    if (operation.done) {
                        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                        setIsLoading(false);
                        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
                        if (downloadLink) {
                            // The response.body contains the MP4 bytes. You must append an API key when fetching from the download link.
                            const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
                            const blob = await response.blob();
                            setVideoUrl(URL.createObjectURL(blob));
                        } else {
                           setError("Video generation finished, but no video URL was found.");
                        }
                    }
                } catch (pollError: any) {
                     if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                     setError(pollError.message);
                     setIsLoading(false);
                     // FIX: Update error message check to match guideline for resetting API key selection.
                     if(pollError.message.includes("Requested entity was not found.")) {
                         setHasApiKey(false); // Reset key state if it becomes invalid
                     }
                }
            }, 10000);

        } catch (err: any) {
            setError(err.message);
            setIsLoading(false);
            // FIX: Update error message check to match guideline for resetting API key selection.
            if(err.message.includes("Requested entity was not found.")) {
                setHasApiKey(false); // Reset key state on initial failure
            }
        }
    };

    return (
        <div className="p-8 text-brand-light">
            <h1 className="text-4xl font-bold mb-2 font-poppins">AI Video Generator (Veo)</h1>
            <p className="text-gray-400 mb-8">
                Create stunning, high-quality video clips from a simple text prompt.
            </p>

            <div className="max-w-4xl mx-auto">
                 {!hasApiKey ? (
                    <Card title="API Key Required">
                        <p className="text-gray-300 mb-4">The Veo video generation model requires you to select your own API key. This is a one-time setup.</p>
                        <p className="text-sm text-gray-400 mb-4">Please note that video generation may incur costs. For details, see the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-brand-accent underline">billing documentation</a>.</p>
                        <Button onClick={handleSelectKey} className="w-auto">Select API Key</Button>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <Card title="1. Create Your Video">
                             <div className="space-y-6">
                                <Input
                                    label="Prompt"
                                    placeholder="e.g., A majestic lion wearing a crown"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    disabled={isLoading}
                                />
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Aspect Ratio</label>
                                    <select
                                        value={aspectRatio}
                                        onChange={(e) => setAspectRatio(e.target.value as '16:9' | '9:16')}
                                        disabled={isLoading}
                                        className="w-full px-3 py-2 bg-brand-dark text-brand-light border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent"
                                    >
                                        <option value="16:9">16:9 (Landscape)</option>
                                        <option value="9:16">9:16 (Portrait)</option>
                                    </select>
                                </div>
                                <Button onClick={handleGenerate} isLoading={isLoading}>
                                    {isLoading ? 'Generating...' : '✨ Generate Video'}
                                </Button>
                                {error && <p className="text-red-400 text-sm">{error}</p>}
                            </div>
                        </Card>
                        <Card title="2. Generated Video">
                            <div className="aspect-video bg-brand-dark rounded-lg flex items-center justify-center">
                                {isLoading && (
                                    <div className="text-center">
                                        <Loader />
                                        <p className="mt-4 text-gray-400 text-sm">{loadingMessage}</p>
                                    </div>
                                )}
                                {!isLoading && !videoUrl && (
                                    <p className="text-gray-500">Your video will appear here.</p>
                                )}
                                {videoUrl && (
                                    <video src={videoUrl} controls autoPlay loop className="w-full h-full rounded-lg" />
                                )}
                            </div>
                            {videoUrl && (
                                <a href={videoUrl} download={`${prompt.slice(0, 30)}.mp4`} className="block w-full mt-4">
                                     <Button className="w-full">Download Video</Button>
                                </a>
                            )}
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VideoGenerator;