import React, { useState, useEffect } from 'react';
import { EventThemeIdea, Service } from '../types';
import { generateEventThemeIdea } from '../services/geminiService';
import { supabase } from '../services/supabaseClient';
import Card from './common/Card';
import Button from './common/Button';
import Input from './common/Input';
import Loader from './common/Loader';

const EventThemeIdeator: React.FC = () => {
    const [theme, setTheme] = useState('80s Retro Party');
    const [idea, setIdea] = useState<EventThemeIdea | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [serviceNames, setServiceNames] = useState<string[]>([]);

    useEffect(() => {
        const fetchServices = async () => {
            const { data, error } = await supabase.from('services').select('name').returns<{name: string}[]>();
            if (error) {
                console.error("Could not fetch service names for ideator");
            } else {
                setServiceNames(data.map(s => s.name));
            }
        };
        fetchServices();
    }, []);

    const handleGenerate = async () => {
        if (!theme.trim()) {
            setError('Please enter an event theme.');
            return;
        }
        if (serviceNames.length === 0) {
            setError('Service list is not available. Cannot generate ideas.');
            return;
        }
        setError('');
        setIsLoading(true);
        setIdea(null);
        try {
            const result = await generateEventThemeIdea(theme, serviceNames);
            setIdea(result);
        } catch (err: any) {
            setError(err.message || 'Failed to generate ideas.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-8 text-brand-light">
            <h1 className="text-4xl font-bold mb-2 font-poppins">AI Event Theme Ideator</h1>
            <p className="text-gray-400 mb-8">
                Generate a complete event blueprint—from taglines to service packages—based on a single theme.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Input */}
                <div className="lg:col-span-1">
                    <Card title="1. Enter Your Theme">
                        <div className="space-y-4">
                            <Input
                                label="Event Theme"
                                placeholder="e.g., Futuristic Sci-Fi Gala"
                                value={theme}
                                onChange={(e) => setTheme(e.target.value)}
                            />
                            <Button onClick={handleGenerate} isLoading={isLoading}>
                                {isLoading ? 'Generating...' : '✨ Generate Event Blueprint'}
                            </Button>
                            {error && <p className="text-red-400 mt-2 text-sm">{error}</p>}
                        </div>
                    </Card>
                </div>

                {/* Right Column: Results */}
                <div className="lg:col-span-2">
                    <Card title="2. Your AI-Generated Event Blueprint">
                        {isLoading && (
                            <div className="flex justify-center items-center h-96">
                                <Loader />
                            </div>
                        )}

                        {!isLoading && !idea && (
                            <div className="text-center py-32 text-gray-500">
                                <p>Your event blueprint will appear here.</p>
                                <p>Enter a theme to get started.</p>
                            </div>
                        )}

                        {idea && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-200">Suggested Tagline</h3>
                                    <p className="p-3 bg-brand-accent/10 border-l-4 border-brand-accent rounded-r-lg text-brand-accent italic font-semibold text-xl mt-2">
                                        "{idea.tagline}"
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold text-gray-200 mb-2">Recommended Service Package</h3>
                                    <div className="space-y-3">
                                        {idea.suggestedPackage.map((item, index) => (
                                            <div key={index} className="p-3 bg-brand-dark rounded-md border border-gray-700">
                                                <h4 className="font-semibold text-brand-light">{item.serviceName}</h4>
                                                <p className="text-sm text-gray-400">{item.reason}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                 <div>
                                    <h3 className="text-lg font-semibold text-gray-200 mb-2">Social Media Campaign Ideas</h3>
                                     <div className="space-y-3">
                                        {idea.socialMediaCampaign.map((item, index) => (
                                            <div key={index} className="p-3 bg-brand-dark rounded-md border border-gray-700">
                                                <h4 className="font-semibold text-brand-light">{item.platform}</h4>
                                                <p className="text-sm text-gray-400">{item.postIdea}</p>
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

export default EventThemeIdeator;
