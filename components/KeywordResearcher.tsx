
import React, { useState } from 'react';
import { KeywordIdeas } from '../types';
import { generateKeywordIdeas } from '../services/geminiService';
import Card from './common/Card';
import Button from './common/Button';
import Input from './common/Input';
import Loader from './common/Loader';

const KeywordListCard: React.FC<{ title: string; keywords: string[] }> = ({ title, keywords }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
        if (!keywords || keywords.length === 0) return;
        navigator.clipboard.writeText(keywords.join('\n'));
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <Card title={title}>
            {keywords.length > 0 && (
                <div className="flex justify-end mb-4">
                    <button
                        onClick={handleCopy}
                        className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs font-semibold rounded-md transition-colors"
                    >
                        {isCopied ? 'Copied!' : 'Copy List'}
                    </button>
                </div>
            )}
            <ul className="space-y-2">
                {keywords.map((keyword, index) => (
                    <li key={index} className="p-2 bg-brand-dark rounded-md text-gray-300 text-sm">
                        {keyword}
                    </li>
                ))}
            </ul>
        </Card>
    );
};


const KeywordResearcher: React.FC = () => {
    const [topic, setTopic] = useState('');
    const [ideas, setIdeas] = useState<KeywordIdeas | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!topic.trim()) {
            setError('Please enter a topic or seed keyword.');
            return;
        }
        setError('');
        setIsLoading(true);
        setIdeas(null);
        try {
            const result = await generateKeywordIdeas(topic);
            setIdeas(result);
        } catch (err: any) {
            setError(err.message || 'Failed to generate keyword ideas.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-8 text-brand-light">
            <h1 className="text-4xl font-bold mb-2 font-poppins">AI Keyword Researcher</h1>
            <p className="text-gray-400 mb-8">
                Discover new keyword opportunities and content ideas for your brand.
            </p>

            <div className="max-w-3xl mx-auto flex flex-col gap-8">
                <Card title="Enter a Topic">
                    <div className="space-y-4">
                        <Input
                            label="Seed Keyword or Topic"
                            placeholder="e.g., corporate event entertainment"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                        />
                        <Button onClick={handleGenerate} isLoading={isLoading} className="w-auto">
                            {isLoading ? 'Generating Ideas...' : '✨ Generate Keyword Ideas'}
                        </Button>
                        {error && <p className="text-red-400 mt-2">{error}</p>}
                    </div>
                </Card>

                {isLoading && (
                    <div className="flex justify-center items-center h-40">
                        <Loader />
                    </div>
                )}

                {!isLoading && !ideas && (
                    <div className="text-center py-16 text-gray-500 bg-brand-secondary rounded-lg">
                        <p>Your keyword ideas will appear here.</p>
                        <p>Enter a topic above to get started.</p>
                    </div>
                )}
                
                {ideas && (
                    <div className="grid grid-cols-1 gap-8">
                        <KeywordListCard title="Long-Tail Keywords" keywords={ideas.longTailKeywords} />
                        <KeywordListCard title="Question-Based Keywords" keywords={ideas.questionKeywords} />
                        <KeywordListCard title="Related Topics for Content" keywords={ideas.relatedTopics} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default KeywordResearcher;
