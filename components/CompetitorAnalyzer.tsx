
import React, { useState } from 'react';
import { CompetitorAnalysis } from '../types';
import { analyzeCompetitor } from '../services/geminiService';
import Card from './common/Card';
import Button from './common/Button';
import Input from './common/Input';
import TextArea from './common/TextArea';
import Loader from './common/Loader';

const CheckListIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-brand-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);


const AnalysisResultCard: React.FC<{ title: string; items: string[] | string }> = ({ title, items }) => {
    return (
        <Card title={title}>
            {Array.isArray(items) ? (
                <ul className="space-y-3">
                    {items.map((item, index) => (
                        <li key={index} className="flex items-start">
                           <CheckListIcon />
                            <span className="text-gray-300">{item}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-gray-300">{items}</p>
            )}
        </Card>
    );
};


const CompetitorAnalyzer: React.FC = () => {
    const [url, setUrl] = useState('');
    const [description, setDescription] = useState('');
    const [analysis, setAnalysis] = useState<CompetitorAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAnalyze = async () => {
        if (!url.trim() || !description.trim()) {
            setError('Please provide both a URL and a description of the competitor.');
            return;
        }
        setError('');
        setIsLoading(true);
        setAnalysis(null);
        try {
            const result = await analyzeCompetitor(url, description);
            setAnalysis(result);
        } catch (err: any) {
            setError(err.message || 'Failed to generate competitor analysis.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-8 text-brand-light">
            <h1 className="text-4xl font-bold mb-2 font-poppins">AI Competitor Analysis</h1>
            <p className="text-gray-400 mb-8">
                Get AI-powered insights into your competitors' SEO and content strategies.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Inputs */}
                <div className="flex flex-col gap-8">
                    <Card title="1. Analyze a Competitor">
                        <div className="space-y-4">
                            <Input
                                label="Competitor Website URL"
                                placeholder="https://competitor.com"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                type="url"
                            />
                            <TextArea
                                label="Briefly describe their business"
                                placeholder="e.g., They rent out classic 80s arcade machines for parties in the same city."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={5}
                            />
                            <Button onClick={handleAnalyze} isLoading={isLoading}>
                                {isLoading ? 'Analyzing...' : '✨ Analyze Competitor'}
                            </Button>
                            {error && <p className="text-red-400 mt-2">{error}</p>}
                        </div>
                    </Card>
                </div>

                {/* Right Column: Results */}
                <div className="flex flex-col gap-8">
                    {isLoading && (
                        <div className="flex justify-center items-center h-full">
                            <Loader />
                        </div>
                    )}

                    {!isLoading && !analysis && (
                        <div className="text-center py-16 text-gray-500 bg-brand-secondary rounded-lg h-full flex flex-col justify-center">
                            <p>Your competitor analysis will appear here.</p>
                            <p>Enter a URL and description to get started.</p>
                        </div>
                    )}
                    
                    {analysis && (
                        <div className="space-y-8">
                            <AnalysisResultCard title="SEO Strengths" items={analysis.seoStrengths} />
                            <AnalysisResultCard title="Content Strategy" items={analysis.contentStrategy} />
                            <AnalysisResultCard title="Brand Tone of Voice" items={analysis.toneOfVoice} />
                            <AnalysisResultCard title="Opportunities for You" items={analysis.opportunities} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CompetitorAnalyzer;
