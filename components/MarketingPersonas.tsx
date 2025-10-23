import React, { useState } from 'react';
import { MarketingPersona } from '../types';
import { generateMarketingPersona, generateImage } from '../services/geminiService';
import Card from './common/Card';
import Button from './common/Button';
import TextArea from './common/TextArea';
import Loader from './common/Loader';

const InfoItem: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
    <div className="flex items-center text-sm">
        <span className="text-brand-accent w-5 h-5 mr-3">{icon}</span>
        <span className="font-semibold text-gray-400 mr-2">{label}:</span>
        <span className="text-white">{value}</span>
    </div>
);

const SectionList: React.FC<{ title: string; items: string[] }> = ({ title, items }) => (
    <div>
        <h4 className="text-lg font-semibold text-gray-200 mb-2 font-poppins">{title}</h4>
        <ul className="space-y-2">
            {items.map((item, index) => (
                <li key={index} className="flex items-start p-2 bg-brand-dark rounded-md">
                    <svg className="w-4 h-4 mr-2 mt-1 flex-shrink-0 text-brand-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                    <span className="text-gray-300 text-sm">{item}</span>
                </li>
            ))}
        </ul>
    </div>
);

const MarketingPersonas: React.FC = () => {
    const [businessDescription] = useState('Retreat Arcade is a luxury event rental company specializing in high-end, modern arcade games for corporate events, weddings, and exclusive parties.');
    const [targetAudience, setTargetAudience] = useState('Corporate event planners for tech companies');
    const [persona, setPersona] = useState<MarketingPersona | null>(null);
    const [personaImage, setPersonaImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!targetAudience.trim()) {
            setError('Please describe your target audience.');
            return;
        }
        setError('');
        setIsLoading(true);
        setPersona(null);
        setPersonaImage(null);
        try {
            const personaData = await generateMarketingPersona(businessDescription, targetAudience);
            setPersona(personaData);
            // Now generate the image based on the description from the persona data
            const imageUrl = await generateImage(personaData.photoDescription);
            setPersonaImage(imageUrl);
        } catch (err: any) {
            setError(err.message || 'Failed to generate persona.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-8 text-brand-light">
            <h1 className="text-4xl font-bold mb-2 font-poppins">AI Marketing Persona Generator</h1>
            <p className="text-gray-400 mb-8">
                Create detailed customer avatars to guide your marketing strategy.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Input */}
                <div className="lg:col-span-1">
                    <Card title="1. Define Your Audience">
                        <div className="space-y-4">
                            <TextArea
                                label="Describe the target customer"
                                placeholder="e.g., Brides looking for unique wedding entertainment, Marketing managers at large corporations"
                                value={targetAudience}
                                onChange={(e) => setTargetAudience(e.target.value)}
                                rows={6}
                            />
                            <Button onClick={handleGenerate} isLoading={isLoading}>
                                {isLoading ? 'Generating...' : '✨ Generate Persona'}
                            </Button>
                            {error && <p className="text-red-400 mt-2 text-sm">{error}</p>}
                        </div>
                    </Card>
                </div>

                {/* Right Column: Results */}
                <div className="lg:col-span-2">
                    <Card title="2. Your AI-Generated Persona">
                        {isLoading && (
                            <div className="flex flex-col justify-center items-center h-96">
                                <Loader />
                                <p className="mt-4 text-gray-400">{persona ? 'Generating image...' : 'Building persona...'}</p>
                            </div>
                        )}

                        {!isLoading && !persona && (
                            <div className="text-center py-32 text-gray-500">
                                <p>Your customer persona will appear here.</p>
                                <p>Describe your audience to get started.</p>
                            </div>
                        )}

                        {persona && (
                            <div className="space-y-6">
                                {/* Profile Header */}
                                <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-brand-dark rounded-lg">
                                    <div className="w-32 h-32 rounded-full bg-gray-700 flex-shrink-0 flex items-center justify-center">
                                        {personaImage ? (
                                            <img src={personaImage} alt={persona.name} className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            <Loader size="sm" />
                                        )}
                                    </div>
                                    <div className="space-y-2 text-center sm:text-left">
                                        <h2 className="text-3xl font-bold text-white font-poppins">{persona.name}</h2>
                                        <InfoItem icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0c-.454-.303-.977-.454-1.5-.454V5.454c.523 0 1.046-.151 1.5-.454a2.704 2.704 0 013 0 2.704 2.704 0 003 0 2.704 2.704 0 013 0 2.704 2.704 0 003 0c.454.303.977.454 1.5.454v10.092zM15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} label="Age" value={persona.demographics.age} />
                                        <InfoItem icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>} label="Job" value={persona.demographics.jobTitle} />
                                        <InfoItem icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} label="Location" value={persona.demographics.location} />
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <SectionList title="Goals & Motivations" items={persona.goals} />
                                    <SectionList title="Pain Points & Challenges" items={persona.painPoints} />
                                </div>

                                <SectionList title="Watering Holes (Where to find them)" items={persona.wateringHoles} />
                                
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-200 mb-2 font-poppins">Marketing Message</h4>
                                    <div className="p-4 bg-brand-accent/10 border-l-4 border-brand-accent rounded-r-lg">
                                        <p className="text-brand-accent italic">"{persona.marketingMessage}"</p>
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

export default MarketingPersonas;
