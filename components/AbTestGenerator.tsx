import React, { useState } from 'react';
import { AbTestIdea } from '../types';
import { generateAbTestIdeas } from '../services/geminiService';
import Card from './common/Card';
import Button from './common/Button';
import Input from './common/Input';
import TextArea from './common/TextArea';
import Loader from './common/Loader';

// A specific component for displaying a single test idea card
const TestIdeaCard: React.FC<{ idea: AbTestIdea, index: number }> = ({ idea, index }) => {
    return (
        <div className="bg-brand-dark p-4 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-brand-accent mb-3">Hypothesis #{index + 1}</h3>
            <p className="italic text-gray-300 mb-4">"{idea.hypothesis}"</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <h4 className="font-semibold text-gray-400 text-sm mb-1">Variant A (Control)</h4>
                    <p className="p-2 bg-gray-900 rounded-md text-sm">{idea.variantA}</p>
                </div>
                 <div>
                    <h4 className="font-semibold text-green-400 text-sm mb-1">Variant B (Challenger)</h4>
                    <p className="p-2 bg-gray-900 rounded-md text-sm">{idea.variantB}</p>
                </div>
            </div>

            <div>
                <h4 className="font-semibold text-gray-400 text-sm mb-1">Primary Metric</h4>
                <p className="text-sm font-medium text-white bg-gray-700 inline-block px-2 py-1 rounded-md">{idea.primaryMetric}</p>
            </div>
        </div>
    );
};


const AbTestGenerator: React.FC = () => {
    const [pageDescription, setPageDescription] = useState('Our homepage, which features a large hero video and a contact form.');
    const [pageGoal, setPageGoal] = useState('Increase contact form submissions.');
    const [elementToTest, setElementToTest] = useState('Call-to-Action');
    const [testIdeas, setTestIdeas] = useState<AbTestIdea[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!pageDescription.trim() || !pageGoal.trim()) {
            setError('Please fill out all fields to generate ideas.');
            return;
        }
        setError('');
        setIsLoading(true);
        setTestIdeas([]);
        try {
            const result = await generateAbTestIdeas(pageDescription, pageGoal, elementToTest);
            setTestIdeas(result);
        } catch (err: any) {
            setError(err.message || 'Failed to generate A/B test ideas.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-8 text-brand-light">
            <h1 className="text-4xl font-bold mb-2 font-poppins">AI A/B Testing Idea Generator</h1>
            <p className="text-gray-400 mb-8">
                Generate data-driven hypotheses to improve your website's conversion rates.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Controls */}
                <div className="lg:col-span-1">
                    <Card title="1. Configure Your Test">
                        <div className="space-y-6">
                            <TextArea
                                label="Describe the page"
                                placeholder="e.g., The pricing page for our premium services."
                                value={pageDescription}
                                onChange={(e) => setPageDescription(e.target.value)}
                                rows={4}
                            />
                            <Input
                                label="What is the primary goal of the page?"
                                placeholder="e.g., Increase 'Book Now' button clicks."
                                value={pageGoal}
                                onChange={(e) => setPageGoal(e.target.value)}
                            />
                             <div>
                                <label htmlFor="element-select" className="block text-sm font-medium text-gray-300 mb-1">
                                    Element to Test
                                </label>
                                <select
                                    id="element-select"
                                    value={elementToTest}
                                    onChange={(e) => setElementToTest(e.target.value)}
                                    className="w-full px-3 py-2 bg-brand-dark text-brand-light border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent"
                                >
                                    <option>Headline</option>
                                    <option>Call-to-Action</option>
                                    <option>Hero Image/Video</option>
                                    <option>Page Layout</option>
                                    <option>Form Fields</option>
                                </select>
                            </div>
                            <Button onClick={handleGenerate} isLoading={isLoading}>
                                {isLoading ? 'Generating...' : '✨ Generate Test Ideas'}
                            </Button>
                            {error && <p className="text-red-400 text-sm">{error}</p>}
                        </div>
                    </Card>
                </div>

                {/* Right Column: Results */}
                <div className="lg:col-span-2">
                    <Card title="2. Generated A/B Test Ideas">
                        {isLoading && (
                            <div className="flex justify-center items-center h-96">
                                <Loader />
                            </div>
                        )}
                        {!isLoading && testIdeas.length === 0 && (
                            <div className="text-center py-32 text-gray-500">
                                <p>Your generated test ideas will appear here.</p>
                                <p>Describe your page and goal to start.</p>
                            </div>
                        )}
                        {testIdeas.length > 0 && (
                            <div className="space-y-4">
                                {testIdeas.map((idea, index) => (
                                    <TestIdeaCard key={index} idea={idea} index={index} />
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default AbTestGenerator;
