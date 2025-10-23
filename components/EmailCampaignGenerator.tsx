import React, { useState } from 'react';
import { Email } from '../types';
import { generateEmailCampaign } from '../services/geminiService';
import Card from './common/Card';
import Button from './common/Button';
import TextArea from './common/TextArea';
import Loader from './common/Loader';

const EmailAccordionItem: React.FC<{ email: Email, index: number }> = ({ email, index }) => {
    const [isOpen, setIsOpen] = useState(index === 0);
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
        const fullText = `Subject: ${email.subject}\n\n${email.body}`;
        navigator.clipboard.writeText(fullText);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className="border-b border-gray-700">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center text-left p-4 hover:bg-brand-dark transition-colors"
                aria-expanded={isOpen}
            >
                <div className="flex items-center">
                    <span className="font-semibold text-brand-accent mr-2">Email {index + 1}:</span>
                    <span className="font-semibold text-gray-200 truncate">{email.subject}</span>
                </div>
                <svg
                    className={`w-5 h-5 text-gray-400 transform transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isOpen && (
                <div className="p-4 bg-brand-dark">
                    <div className="flex justify-end mb-2">
                         <button
                            onClick={handleCopy}
                            className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs font-semibold rounded-md transition-colors"
                        >
                            {isCopied ? 'Copied!' : 'Copy Email'}
                        </button>
                    </div>
                    <div className="p-4 bg-gray-900 rounded-md">
                        <h4 className="font-semibold text-gray-400 text-sm mb-1">SUBJECT:</h4>
                        <p className="text-gray-200 mb-4">{email.subject}</p>
                        <h4 className="font-semibold text-gray-400 text-sm mb-1">BODY:</h4>
                        <p className="text-gray-300 whitespace-pre-wrap">{email.body}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

const EmailCampaignGenerator: React.FC = () => {
    const [goal, setGoal] = useState('Announce our new partnership and offer an early-bird discount.');
    const [audience, setAudience] = useState('Our list of corporate clients');
    const [emailCount, setEmailCount] = useState(3);
    const [tone, setTone] = useState('Exclusive');
    const [campaign, setCampaign] = useState<Email[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isCopied, setIsCopied] = useState(false);

    const handleGenerate = async () => {
        if (!goal.trim() || !audience.trim()) {
            setError('Please provide a campaign goal and target audience.');
            return;
        }
        setError('');
        setIsLoading(true);
        setCampaign([]);
        try {
            const result = await generateEmailCampaign(goal, audience, emailCount, tone);
            setCampaign(result);
        } catch (err: any) {
            setError(err.message || 'Failed to generate email campaign.');
        } finally {
            setIsLoading(false);
        }
    };

     const handleCopyAll = () => {
        if (campaign.length === 0) return;
        const fullText = campaign.map((email, index) =>
            `--- EMAIL ${index + 1} ---\n\nSubject: ${email.subject}\n\n${email.body}`
        ).join('\n\n\n');
        navigator.clipboard.writeText(fullText);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className="p-8 text-brand-light">
            <h1 className="text-4xl font-bold mb-2 font-poppins">AI Email Campaign Generator</h1>
            <p className="text-gray-400 mb-8">
                Generate complete, multi-step email sequences for any marketing goal.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Controls */}
                <div className="lg:col-span-1">
                    <Card title="1. Configure Your Campaign">
                        <div className="space-y-6">
                            <TextArea
                                label="Campaign Goal"
                                placeholder="e.g., Launch our new VR Racing Rig to our email list."
                                value={goal}
                                onChange={(e) => setGoal(e.target.value)}
                                rows={4}
                            />
                            <TextArea
                                label="Target Audience"
                                placeholder="e.g., Previous customers who have rented from us before."
                                value={audience}
                                onChange={(e) => setAudience(e.target.value)}
                                rows={3}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="email-count" className="block text-sm font-medium text-gray-300 mb-1">
                                        Number of Emails
                                    </label>
                                    <select
                                        id="email-count"
                                        value={emailCount}
                                        onChange={(e) => setEmailCount(parseInt(e.target.value, 10))}
                                        className="w-full px-3 py-2 bg-brand-dark text-brand-light border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent"
                                    >
                                        <option>2</option>
                                        <option>3</option>
                                        <option>4</option>
                                        <option>5</option>
                                    </select>
                                </div>
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
                                        <option>Exclusive</option>
                                        <option>Exciting</option>
                                        <option>Informational</option>
                                        <option>Urgent</option>
                                        <option>Friendly</option>
                                    </select>
                                </div>
                            </div>
                            <Button onClick={handleGenerate} isLoading={isLoading}>
                                {isLoading ? 'Generating...' : '✨ Generate Email Campaign'}
                            </Button>
                            {error && <p className="text-red-400 text-sm">{error}</p>}
                        </div>
                    </Card>
                </div>

                {/* Right Column: Results */}
                <div className="lg:col-span-2">
                    <Card title="2. Generated Email Campaign">
                        {isLoading && (
                            <div className="flex justify-center items-center h-96">
                                <Loader />
                            </div>
                        )}
                        {!isLoading && campaign.length === 0 && (
                            <div className="text-center py-32 text-gray-500">
                                <p>Your generated email sequence will appear here.</p>
                                <p>Configure your campaign details to get started.</p>
                            </div>
                        )}
                        {campaign.length > 0 && (
                            <div>
                                <div className="flex justify-end mb-4">
                                     <button
                                        onClick={handleCopyAll}
                                        className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white text-sm font-semibold rounded-md transition-colors"
                                    >
                                        {isCopied ? 'Copied!' : 'Copy Entire Campaign'}
                                    </button>
                                </div>
                                <div className="bg-brand-secondary rounded-lg overflow-hidden border border-gray-700">
                                    {campaign.map((email, index) => (
                                        <EmailAccordionItem key={index} email={email} index={index} />
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

export default EmailCampaignGenerator;