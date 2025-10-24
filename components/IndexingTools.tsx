import React, { useState } from 'react';
import { generateRobotsTxt } from '../services/geminiService';
import Card from './common/Card';
import Button from './common/Button';
import Loader from './common/Loader';
import TextArea from './common/TextArea';

const IndexingTools: React.FC = () => {
    const [robotsTxt, setRobotsTxt] = useState('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState('');
    const [isCopied, setIsCopied] = useState<boolean>(false);

    const handleGenerateRobots = async () => {
        setIsLoading(true);
        setError('');
        try {
            const result = await generateRobotsTxt();
            setRobotsTxt(result);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        if (!robotsTxt) return;
        navigator.clipboard.writeText(robotsTxt);
        setIsCopied(true);
        setTimeout(() => setIsCopied(null), 2000);
    };

    return (
        <div className="p-8 text-brand-light">
            <h1 className="text-4xl font-bold mb-2 font-poppins">Indexing Tools</h1>
            <p className="text-gray-400 mb-8">
                Generate a `robots.txt` file for search engine crawlers. Your `sitemap.xml` is generated automatically.
            </p>

            {error && <p className="text-red-400 bg-red-500/10 p-3 rounded-md mb-6">{error}</p>}
            
            <div className="max-w-2xl">
                <Card title="robots.txt Generator">
                    <p className="text-sm text-gray-400 mb-4">
                        This file tells search engines which pages on your site to crawl. Place the generated file in the root directory of your website.
                    </p>
                    <Button onClick={handleGenerateRobots} isLoading={isLoading} className="w-auto mb-4">
                        {isLoading ? 'Generating...' : '✨ Generate robots.txt'}
                    </Button>
                    {robotsTxt && (
                        <div>
                             <div className="flex justify-end mb-2">
                                <button onClick={handleCopy} className="px-3 py-1 bg-gray-600 text-xs rounded-md">{isCopied ? 'Copied!' : 'Copy'}</button>
                            </div>
                            <TextArea value={robotsTxt} readOnly rows={8} />
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default IndexingTools;