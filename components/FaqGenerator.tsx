import React, { useState } from 'react';
import { FaqItem } from '../types';
import { generateFaqs, generateFaqPageSchema } from '../services/geminiService';
import Card from './common/Card';
import Button from './common/Button';
import Input from './common/Input';
import TextArea from './common/TextArea';
import Loader from './common/Loader';

const AccordionItem: React.FC<{ faq: FaqItem }> = ({ faq }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-b border-gray-700">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center text-left p-4 hover:bg-brand-dark transition-colors"
                aria-expanded={isOpen}
            >
                <span className="font-semibold text-gray-200">{faq.question}</span>
                <svg
                    className={`w-5 h-5 text-gray-400 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isOpen && (
                <div className="p-4 bg-brand-dark">
                    <p className="text-gray-300 whitespace-pre-wrap">{faq.answer}</p>
                </div>
            )}
        </div>
    );
};

const FaqGenerator: React.FC = () => {
    const [pageTopic, setPageTopic] = useState('Our Neo-Tokyo VR Racing Rig service page');
    const [audience, setAudience] = useState('Corporate event planners');
    const [faqs, setFaqs] = useState<FaqItem[]>([]);
    const [schema, setSchema] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isCopiedHtml, setIsCopiedHtml] = useState(false);
    const [isCopiedSchema, setIsCopiedSchema] = useState(false);

    const handleGenerate = async () => {
        if (!pageTopic.trim() || !audience.trim()) {
            setError('Please provide a page topic and target audience.');
            return;
        }
        setError('');
        setIsLoading(true);
        setFaqs([]);
        setSchema('');
        try {
            const result = await generateFaqs(pageTopic, audience);
            setFaqs(result);
            if (result.length > 0) {
                const schemaResult = await generateFaqPageSchema(result);
                setSchema(schemaResult);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to generate FAQs.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = (type: 'html' | 'schema') => {
        if (faqs.length === 0) return;
        if (type === 'html') {
            const html = faqs.map(faq => 
                `<details>\n  <summary>${faq.question}</summary>\n  <p>${faq.answer}</p>\n</details>`
            ).join('\n\n');
            navigator.clipboard.writeText(html);
            setIsCopiedHtml(true);
            setTimeout(() => setIsCopiedHtml(false), 2000);
        } else {
            navigator.clipboard.writeText(schema);
            setIsCopiedSchema(true);
            setTimeout(() => setIsCopiedSchema(false), 2000);
        }
    };

    return (
        <div className="p-8 text-brand-light">
            <h1 className="text-4xl font-bold mb-2 font-poppins">AI FAQ Generator</h1>
            <p className="text-gray-400 mb-8">
                Automatically create helpful, SEO-friendly FAQ sections for your pages.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Controls */}
                <div className="lg:col-span-1">
                    <Card title="1. Provide Context">
                        <div className="space-y-6">
                            <TextArea
                                label="Page Topic or Content"
                                placeholder="e.g., The pricing page for our premium services."
                                value={pageTopic}
                                onChange={(e) => setPageTopic(e.target.value)}
                                rows={5}
                            />
                            <Input
                                label="Target Audience"
                                placeholder="e.g., Brides looking for wedding entertainment"
                                value={audience}
                                onChange={(e) => setAudience(e.target.value)}
                            />
                            <Button onClick={handleGenerate} isLoading={isLoading}>
                                {isLoading ? 'Generating...' : '✨ Generate FAQs'}
                            </Button>
                            {error && <p className="text-red-400 text-sm">{error}</p>}
                        </div>
                    </Card>
                </div>

                {/* Right Column: Results */}
                <div className="lg:col-span-2">
                    <Card title="2. Generated FAQs">
                        {isLoading && (
                            <div className="flex justify-center items-center h-96">
                                <Loader />
                            </div>
                        )}
                        {!isLoading && faqs.length === 0 && (
                            <div className="text-center py-32 text-gray-500">
                                <p>Your generated FAQ section will appear here.</p>
                                <p>Provide some context to get started.</p>
                            </div>
                        )}
                        {faqs.length > 0 && (
                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-end mb-4">
                                        <button
                                            onClick={() => handleCopy('html')}
                                            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white text-sm font-semibold rounded-md transition-colors"
                                        >
                                            {isCopiedHtml ? 'Copied!' : 'Copy as HTML'}
                                        </button>
                                    </div>
                                    <div className="bg-brand-secondary rounded-lg overflow-hidden border border-gray-700">
                                        {faqs.map((faq, index) => (
                                            <AccordionItem key={index} faq={faq} />
                                        ))}
                                    </div>
                                </div>
                                {schema && (
                                     <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <h3 className="text-lg font-semibold text-gray-200">FAQPage Schema (JSON-LD)</h3>
                                            <button onClick={() => handleCopy('schema')} className="px-3 py-1 bg-gray-600 text-xs rounded-md">{isCopiedSchema ? 'Copied!' : 'Copy'}</button>
                                        </div>
                                        <p className="text-sm text-gray-400 mb-2">Add this script to your page's {'<head>'} for better SEO.</p>
                                        <TextArea value={schema} readOnly rows={8} />
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default FaqGenerator;