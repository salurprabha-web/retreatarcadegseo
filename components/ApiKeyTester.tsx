
import React, { useState } from 'react';
import { testApiKey } from '../services/geminiService';
import Card from './common/Card';
import Button from './common/Button';
import Loader from './common/Loader';

const CheckCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const XCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);


const ApiKeyTester: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

    const handleTestKey = async () => {
        setIsLoading(true);
        setResult(null);
        try {
            const response = await testApiKey();
            setResult(response);
        } catch (error: any) {
            setResult({ success: false, message: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-8 text-brand-light">
            <h1 className="text-4xl font-bold mb-2 font-poppins">API Key Tester</h1>
            <p className="text-gray-400 mb-8">
                Verify that your Gemini API key is configured correctly and the service is reachable.
            </p>
            <div className="max-w-xl">
                <Card title="Run API Test">
                    <p className="text-sm text-gray-400 mb-6">
                        Click the button below to perform a quick test. This will make a simple call to the Gemini API to ensure everything is working as expected. This can help diagnose issues if AI features are not working.
                    </p>
                    <Button onClick={handleTestKey} isLoading={isLoading} className="w-auto">
                        {isLoading ? 'Testing...' : 'Test API Key'}
                    </Button>

                    {result && !isLoading && (
                        <div className={`mt-6 p-4 rounded-md border ${result.success ? 'bg-green-500/10 border-green-500' : 'bg-red-500/10 border-red-500'}`}>
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    {result.success ? <CheckCircleIcon /> : <XCircleIcon />}
                                </div>
                                <div className="ml-4">
                                    <h3 className={`text-lg font-semibold ${result.success ? 'text-green-300' : 'text-red-300'}`}>
                                        {result.success ? 'Test Successful' : 'Test Failed'}
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-300">{result.message}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default ApiKeyTester;
