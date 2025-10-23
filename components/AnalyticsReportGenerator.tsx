import React, { useState } from 'react';
import { AnalyticsReport } from '../types';
import { generateAnalyticsReport } from '../services/geminiService';
import Card from './common/Card';
import Button from './common/Button';
import Input from './common/Input';
import TextArea from './common/TextArea';
import Loader from './common/Loader';

const initialMetrics = `
- Total Visitors: 12,500 (+15% from previous period)
- Bounce Rate: 45% (-5% from previous period)
- Top 5 Pages: 
  1. /services/vr-racing-rig (3,500 views)
  2. / (Homepage) (2,800 views)
  3. /gallery (1,500 views)
  4. /blog/top-5-wedding-games (900 views)
  5. /services/led-air-hockey (750 views)
- Top 5 Keywords: 
  1. "vr racing simulator rental" (800 clicks)
  2. "luxury arcade games" (650 clicks)
  3. "retreat arcade" (500 clicks)
  4. "corporate event ideas los angeles" (400 clicks)
  5. "wedding entertainment" (300 clicks)
- Conversions (Contact Form): 150 (+20% from previous period)
`;

const ReportSection: React.FC<{ title: string; children: React.ReactNode; icon: React.ReactNode }> = ({ title, children, icon }) => (
    <div>
        <h3 className="text-lg font-semibold text-gray-200 mb-2 flex items-center">
            <span className="text-brand-accent mr-2">{icon}</span>
            {title}
        </h3>
        {children}
    </div>
);

const AnalyticsReportGenerator: React.FC = () => {
    const [timePeriod, setTimePeriod] = useState('Last 30 Days');
    const [metricsData, setMetricsData] = useState(initialMetrics.trim());
    const [report, setReport] = useState<AnalyticsReport | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isCopied, setIsCopied] = useState(false);

    const handleGenerate = async () => {
        if (!timePeriod.trim() || !metricsData.trim()) {
            setError('Please provide a time period and metrics data.');
            return;
        }
        setError('');
        setIsLoading(true);
        setReport(null);
        try {
            const result = await generateAnalyticsReport(timePeriod, metricsData);
            setReport(result);
        } catch (err: any) {
            setError(err.message || 'Failed to generate report.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCopy = () => {
        if (!report) return;
        const fullText = `
Analytics Report: ${report.reportTitle}
-------------------------------------------------

**EXECUTIVE SUMMARY**
${report.executiveSummary}

**KEY WINS**
${report.keyWins.map(item => `- ${item}`).join('\n')}

**AREAS FOR IMPROVEMENT**
${report.areasForImprovement.map(item => `- ${item}`).join('\n')}

**ACTIONABLE RECOMMENDATIONS**
${report.actionableRecommendations.map(item => `- ${item}`).join('\n')}
        `.trim();
        navigator.clipboard.writeText(fullText);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className="p-8 text-brand-light">
            <h1 className="text-4xl font-bold mb-2 font-poppins">AI Analytics Report Generator</h1>
            <p className="text-gray-400 mb-8">
                Transform raw data into actionable insights and a clear performance summary.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Controls */}
                <div className="lg:col-span-1">
                    <Card title="1. Provide Your Data">
                        <div className="space-y-6">
                            <Input
                                label="Time Period"
                                placeholder="e.g., Last 30 Days, Q2 2024"
                                value={timePeriod}
                                onChange={(e) => setTimePeriod(e.target.value)}
                            />
                            <TextArea
                                label="Key Metrics (Paste Here)"
                                value={metricsData}
                                onChange={(e) => setMetricsData(e.target.value)}
                                rows={15}
                                placeholder="Paste your analytics data, e.g., from Google Analytics..."
                            />
                            <Button onClick={handleGenerate} isLoading={isLoading}>
                                {isLoading ? 'Analyzing...' : '✨ Generate Report'}
                            </Button>
                            {error && <p className="text-red-400 text-sm">{error}</p>}
                        </div>
                    </Card>
                </div>

                {/* Right Column: Results */}
                <div className="lg:col-span-2">
                    <Card title="2. Performance Report">
                        {isLoading && (
                            <div className="flex justify-center items-center h-96">
                                <Loader />
                            </div>
                        )}
                        {!isLoading && !report && (
                            <div className="text-center py-32 text-gray-500">
                                <p>Your AI-generated report will appear here.</p>
                                <p>Provide your analytics data to get started.</p>
                            </div>
                        )}
                        {report && (
                            <div className="max-h-[80vh] overflow-y-auto pr-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-2xl font-bold text-white font-poppins">{report.reportTitle}</h2>
                                    <button
                                        onClick={handleCopy}
                                        className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white text-sm font-semibold rounded-md transition-colors"
                                    >
                                        {isCopied ? 'Copied!' : 'Copy Full Report'}
                                    </button>
                                </div>
                                <div className="space-y-6">
                                    <ReportSection title="Executive Summary" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}>
                                        <p className="p-3 bg-brand-dark rounded-md text-gray-300 italic text-sm">{report.executiveSummary}</p>
                                    </ReportSection>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <ReportSection title="Key Wins" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.085a2 2 0 00-1.736.93L5.5 8m7 2H5M5 8h2m7 2h2m-2-2h2m-5 2l2-2" /></svg>}>
                                            <ul className="space-y-2">
                                                {report.keyWins.map((item, i) => <li key={i} className="p-2 bg-brand-dark rounded-md text-gray-300 text-sm">{item}</li>)}
                                            </ul>
                                        </ReportSection>
                                        <ReportSection title="Areas for Improvement" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}>
                                              <ul className="space-y-2">
                                                {report.areasForImprovement.map((item, i) => <li key={i} className="p-2 bg-brand-dark rounded-md text-gray-300 text-sm">{item}</li>)}
                                            </ul>
                                        </ReportSection>
                                    </div>
                                    
                                     <ReportSection title="Actionable Recommendations" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>}>
                                        <ul className="space-y-2">
                                            {report.actionableRecommendations.map((item, i) => (
                                                <li key={i} className="p-3 bg-brand-dark rounded-md text-gray-200 text-sm font-medium border-l-4 border-brand-accent">{item}</li>
                                            ))}
                                        </ul>
                                    </ReportSection>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsReportGenerator;