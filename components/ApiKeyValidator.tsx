import React, { useState } from 'react';
import { validateApiKey } from '../services/geminiService';
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


const ApiKeyValidator: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

    const handleRunTest = async () => {
        setIsLoading(true);
        setResult(null);
        try {
            const response = await validateApiKey();
            setResult(response);
        } catch (err: any) {
            setResult({ success: false, message: err.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-8 text-brand-light">
            <h1 className="text-4xl font-bold mb-2 font-poppins">Gemini API Key Status</h1>
            <p className="text-gray-400 mb-8">
                Verify if your server-side API key is correctly configured and can communicate with Google's services.
            </p>

            <div className="max-w-2xl mx-auto">
                <Card title="API Key Test">
                    <div className="flex flex-col items-center text-center">
                        <p className="text-gray-300 mb-6">
                            This tool performs a simple, low-cost call to list available models from the Gemini API. A successful response confirms your key is valid and has the necessary permissions.
                        </p>
                        
                        <Button onClick={handleRunTest} isLoading={isLoading} className="w-auto">
                            {isLoading ? 'Testing...' : 'Run API Key Test'}
                        </Button>

                        <div className="mt-8 w-full p-6 bg-brand-dark rounded-lg min-h-[150px] flex flex-col justify-center items-center">
                            {isLoading ? (
                                <Loader />
                            ) : result ? (
                                <div className="flex flex-col items-center gap-4">
                                    {result.success ? <CheckCircleIcon /> : <XCircleIcon />}
                                    <h3 className={`text-xl font-bold ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                                        {result.success ? 'Validation Successful' : 'Validation Failed'}
                                    </h3>
                                    <p className="text-gray-300 text-sm max-w-md">{result.message}</p>
                                    {!result.success && (
                                         <p className="text-xs text-gray-500 mt-2">Common causes include an invalid API key, missing billing information on your Google Cloud project, or the Generative Language API not being enabled.</p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-gray-500">Test results will appear here.</p>
                            )}
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default ApiKeyValidator;
