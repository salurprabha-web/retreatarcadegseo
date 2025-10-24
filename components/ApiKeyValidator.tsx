
import React, { useState } from 'react';
import { validateApiKey, getDebugInfo } from '../services/geminiService';
import Card from './common/Card';
import Button from './common/Button';
import Loader from './common/Loader';

const CheckCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const XCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const ApiKeyValidator: React.FC = () => {
    const [debugLoading, setDebugLoading] = useState(false);
    const [debugResult, setDebugResult] = useState<string | null>(null);
    const [debugError, setDebugError] = useState<string | null>(null);

    const [validateLoading, setValidateLoading] = useState(false);
    const [validateResult, setValidateResult] = useState<{ success: boolean; message: string } | null>(null);

    const handleRunDebug = async () => {
        setDebugLoading(true);
        setDebugResult(null);
        setDebugError(null);
        setValidateResult(null); // Reset step 2
        try {
            const response = await getDebugInfo();
            setDebugResult(response.apiKeyStatus);
        } catch (err: any) {
            setDebugError(err.message);
        } finally {
            setDebugLoading(false);
        }
    };

    const handleRunValidation = async () => {
        setValidateLoading(true);
        setValidateResult(null);
        try {
            const response = await validateApiKey();
            setValidateResult(response);
        } catch (err: any) {
            setValidateResult({ success: false, message: err.message });
        } finally {
            setValidateLoading(false);
        }
    };
    
    const isDebugSuccess = debugResult && !debugResult.includes("NOT SET");

    return (
        <div className="p-8 text-brand-light">
            <h1 className="text-4xl font-bold mb-2 font-poppins">Gemini API Key Status</h1>
            <p className="text-gray-400 mb-8">
                A two-step diagnostic tool to verify your server-side API key configuration.
            </p>

            <div className="max-w-3xl mx-auto space-y-8">
                {/* Step 1: Environment Check */}
                <Card title="Step 1: Check Server Environment">
                    <p className="text-gray-400 mb-4 text-sm">
                        This test checks if the backend function can read the `API_KEY` environment variable. It does not contact Google. If this fails, your API key is not configured correctly in your hosting environment.
                    </p>
                    <Button onClick={handleRunDebug} isLoading={debugLoading} className="w-auto">
                        {debugLoading ? 'Checking...' : 'Run Environment Check'}
                    </Button>
                    <div className="mt-4 p-4 bg-brand-dark rounded-md min-h-[80px] flex items-center">
                        {debugLoading ? <Loader size="sm"/> :
                            debugResult ? (
                                <div className="flex items-center gap-4">
                                    {isDebugSuccess ? <CheckCircleIcon /> : <XCircleIcon />}
                                    <div>
                                        <h4 className={`font-bold ${isDebugSuccess ? 'text-green-400' : 'text-red-400'}`}>
                                            {isDebugSuccess ? 'Environment OK' : 'Environment Error'}
                                        </h4>
                                        <p className="text-gray-300 text-sm">{debugResult}</p>
                                    </div>
                                </div>
                            ) : debugError ? (
                                 <div className="flex items-center gap-4">
                                    <XCircleIcon />
                                    <div>
                                        <h4 className="font-bold text-red-400">Function Error</h4>
                                        <p className="text-gray-300 text-sm">{debugError}</p>
                                        <p className="text-xs text-gray-500 mt-1">The server function itself might be crashing. Check its logs.</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm">Results will appear here.</p>
                            )
                        }
                    </div>
                </Card>

                {/* Step 2: API Validation */}
                <Card title="Step 2: Validate Key with Google">
                    <p className="text-gray-400 mb-4 text-sm">
                        This test uses your API key to make a live call to the Gemini API. It should only be run after Step 1 is successful. A failure here indicates a problem with the key itself (e.g., it's invalid, or billing is not enabled).
                    </p>
                     <Button onClick={handleRunValidation} isLoading={validateLoading} className="w-auto" disabled={!isDebugSuccess || debugLoading}>
                        {validateLoading ? 'Validating...' : 'Run Google API Test'}
                    </Button>
                    <div className="mt-4 p-4 bg-brand-dark rounded-md min-h-[80px] flex items-center">
                         {validateLoading ? <Loader size="sm"/> :
                            validateResult ? (
                                <div className="flex items-center gap-4">
                                    {validateResult.success ? <CheckCircleIcon /> : <XCircleIcon />}
                                    <div>
                                        <h4 className={`font-bold ${validateResult.success ? 'text-green-400' : 'text-red-400'}`}>
                                            {validateResult.success ? 'Validation Successful' : 'Validation Failed'}
                                        </h4>
                                        <p className="text-gray-300 text-sm">{validateResult.message}</p>
                                    </div>
                                </div>
                            ) : (
                                 <p className="text-gray-500 text-sm">Results will appear here. Requires a successful Step 1.</p>
                            )
                        }
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default ApiKeyValidator;
