import React, { useState, useMemo } from 'react';
import { getSeoSuggestions } from '../services/geminiService';
import type { SeoData, SeoSuggestions } from '../types';
import Card from './common/Card';
import Button from './common/Button';
import Input from './common/Input';
import TextArea from './common/TextArea';
import Loader from './common/Loader';

// Helper Icons
const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);
const CrossIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
  </svg>
);
const CopyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
);
const ApplyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
);
const TinyCheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
    </svg>
);


const SeoOptimizer: React.FC = () => {
  const [pageContent, setPageContent] = useState<string>('');
  const [focusKeywords, setFocusKeywords] = useState<string>('');
  const [seoData, setSeoData] = useState<SeoData>({
    metaTitle: '',
    metaDescription: '',
    keywords: '',
    slug: '',
    canonicalUrl: '',
  });
  const [suggestions, setSuggestions] = useState<SeoSuggestions | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleGenerateSuggestions = async () => {
    if (!pageContent.trim() || !focusKeywords.trim()) {
      setError('Please provide page content and focus keywords to generate suggestions.');
      return;
    }
    setError(null);
    setIsLoading(true);
    setSuggestions(null);
    try {
      const result = await getSeoSuggestions(pageContent, focusKeywords);
      setSuggestions(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplySuggestion = <K extends keyof SeoSuggestions>(
    field: K,
    value: SeoSuggestions[K]
  ) => {
    const primaryKeyword = focusKeywords.split(',')[0]?.trim() || '';

    if (field === 'title') {
      let finalTitle = value as string;
      if (primaryKeyword && !finalTitle.toLowerCase().includes(primaryKeyword.toLowerCase())) {
        const separator = ' | ';
        // Only append if it fits within the 60 char limit
        if ((finalTitle.length + separator.length + primaryKeyword.length) <= 60) {
            finalTitle = `${finalTitle}${separator}${primaryKeyword}`;
        }
      }
      setSeoData((prev) => ({ ...prev, metaTitle: finalTitle }));
    } else if (field === 'description') {
      setSeoData((prev) => ({ ...prev, metaDescription: value as string }));
    } else if (field === 'keywords') {
      setSeoData((prev) => ({ ...prev, keywords: (value as string[]).join(', ') }));
    }
  };
  
  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setSeoData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveChanges = () => {
    console.log('Saving changes:', seoData);
    alert('Changes saved successfully! (Check console for data)');
  };
  
  const handleClear = () => {
    setPageContent('');
    setFocusKeywords('');
    setError(null);
  };

  const seoChecklist = useMemo(() => {
    const primaryKeyword = focusKeywords.split(',')[0]?.trim().toLowerCase() || '';
    const slugReadyKeyword = primaryKeyword.replace(/\s+/g, '-');

    const isValidUrl = (url: string): boolean => {
      if (!url.trim()) return false;
      try {
        const parsedUrl = new URL(url);
        return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
      } catch (e) {
        return false;
      }
    };

    const checks = [
      {
        text: 'Meta Title has optimal length (10-60 chars)',
        passed: seoData.metaTitle.length >= 10 && seoData.metaTitle.length <= 60,
      },
      {
        text: 'Meta Title contains primary keyword',
        passed: !!primaryKeyword && seoData.metaTitle.toLowerCase().includes(primaryKeyword),
      },
      {
        text: 'Description is readable (length & keyword)',
        passed:
          seoData.metaDescription.length >= 70 &&
          seoData.metaDescription.length <= 160 &&
          !!primaryKeyword &&
          seoData.metaDescription.toLowerCase().includes(primaryKeyword),
      },
      {
        text: 'At least 3 keywords are present',
        passed: seoData.keywords.split(',').filter(k => k.trim()).length >= 3,
      },
      {
        text: 'URL Slug is optimized (format & keyword)',
        passed:
          seoData.slug.startsWith('/') &&
          !!slugReadyKeyword &&
          seoData.slug.toLowerCase().includes(slugReadyKeyword),
      },
      {
        text: 'Canonical URL is a valid URL',
        passed: isValidUrl(seoData.canonicalUrl),
      },
    ];
    return checks;
  }, [seoData, focusKeywords]);

  const seoScore = useMemo(() => {
    if (seoChecklist.length === 0) return 0;
    const passedCount = seoChecklist.filter(item => item.passed).length;
    return Math.round((passedCount / seoChecklist.length) * 100);
  }, [seoChecklist]);


  return (
    <div className="p-8 text-brand-light">
      <h1 className="text-4xl font-bold mb-2 font-poppins">AI SEO Optimizer</h1>
      <p className="text-gray-400 mb-8">
        Leverage Gemini AI to generate powerful, high-ranking SEO metadata for your pages.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Inputs and Suggestions */}
        <div className="flex flex-col gap-8">
          <Card title="1. Content Analysis">
            <div className="space-y-4">
              <TextArea
                label="Page Content or Topic"
                placeholder="Paste your full page content or describe the page topic here..."
                value={pageContent}
                onChange={(e) => setPageContent(e.target.value)}
                rows={10}
              />
              <Input
                label="Focus Keywords"
                placeholder="e.g., luxury event rentals, corporate party games"
                value={focusKeywords}
                onChange={(e) => setFocusKeywords(e.target.value)}
              />
              <div className="flex gap-4">
                <Button onClick={handleGenerateSuggestions} isLoading={isLoading}>
                  {isLoading ? 'Generating...' : 'Generate AI Suggestions'}
                </Button>
                <button 
                  onClick={handleClear}
                  className="w-auto px-4 py-3 bg-brand-secondary hover:bg-gray-700 text-sm font-semibold rounded-md transition-colors"
                >
                  Clear Fields
                </button>
              </div>
              {error && <p className="text-red-400 mt-2">{error}</p>}
            </div>
          </Card>

          <Card title="2. AI Suggestions">
            {isLoading && (
              <div className="flex justify-center items-center h-40">
                <Loader />
              </div>
            )}
            {!isLoading && !suggestions && (
              <p className="text-gray-400 text-center py-16">
                Your AI-powered SEO suggestions will appear here.
              </p>
            )}
            {suggestions && (
              <div className="space-y-6">
                {[
                  { key: 'title', label: 'Suggested Title', value: suggestions.title },
                  { key: 'description', label: 'Suggested Description', value: suggestions.description },
                  { key: 'keywords', label: 'Suggested Keywords', value: suggestions.keywords },
                ].map(({key, label, value}) => (
                    <div key={key}>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-300">{label}</label>
                         <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleApplySuggestion(key as keyof SeoSuggestions, value)}
                                className="p-2 rounded-full text-gray-300 bg-gray-700 hover:bg-brand-accent hover:text-brand-dark transition-colors"
                                title="Apply Suggestion"
                                aria-label="Apply suggestion"
                            >
                                <ApplyIcon />
                            </button>
                            <button
                                onClick={() => handleCopy(Array.isArray(value) ? value.join(', ') : value, key)}
                                className="p-2 rounded-full text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors"
                                title={copiedField === key ? 'Copied!' : 'Copy to clipboard'}
                                aria-label={copiedField === key ? 'Copied to clipboard' : 'Copy to clipboard'}
                            >
                                {copiedField === key ? <TinyCheckIcon /> : <CopyIcon />}
                            </button>
                        </div>
                      </div>

                      <div className="p-3 bg-brand-dark rounded-md text-gray-200">
                        {key === 'keywords' ? (
                            <div className="flex flex-wrap gap-2">
                              {(value as string[]).map((kw, i) => (
                                <span key={i} className="bg-gray-700 text-brand-light text-xs font-medium px-2.5 py-1 rounded-full">{kw}</span>
                              ))}
                            </div>
                          ) : (
                            <p>{value as string}</p>
                          )}
                      </div>
                    </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Final SEO Form */}
        <div>
          <Card title="3. Finalize & Save SEO">
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-200 mb-4">Live SEO Checklist & Score</h3>
                <div className="flex items-center gap-6 bg-brand-dark p-4 rounded-lg">
                    {/* Score Circle */}
                    <div className="relative flex items-center justify-center w-24 h-24">
                        <svg className="transform -rotate-90 w-full h-full">
                            <circle cx="50%" cy="50%" r="45%" strokeWidth="8" stroke="currentColor" fill="transparent" className="text-gray-700" />
                            <circle
                                cx="50%" cy="50%" r="45%" strokeWidth="8" stroke="currentColor" fill="transparent"
                                strokeLinecap="round"
                                strokeDasharray={2 * Math.PI * 45}
                                strokeDashoffset={2 * Math.PI * 45 * (1 - seoScore / 100)}
                                className="text-brand-accent transition-all duration-500"
                            />
                        </svg>
                        <span className="absolute text-2xl font-bold text-white">{seoScore}%</span>
                    </div>
                    {/* Checklist */}
                    <ul className="space-y-2">
                        {seoChecklist.map((item, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                            {item.passed ? <CheckIcon /> : <CrossIcon />}
                            <span className={item.passed ? 'text-gray-300' : 'text-gray-400'}>{item.text}</span>
                        </li>
                        ))}
                    </ul>
                </div>
            </div>
            <div className="space-y-4">
              <Input
                label="Meta Title"
                name="metaTitle"
                value={seoData.metaTitle}
                onChange={handleInputChange}
                maxLength={60}
                showCharCount
              />
              <TextArea
                label="Meta Description"
                name="metaDescription"
                value={seoData.metaDescription}
                onChange={handleInputChange}
                rows={4}
                maxLength={160}
                showCharCount
              />
              <TextArea
                label="Keywords (comma-separated)"
                name="keywords"
                placeholder="keyword one, keyword two, keyword three"
                value={seoData.keywords}
                onChange={handleInputChange}
                rows={3}
              />
               <Input
                label="URL Slug"
                name="slug"
                placeholder="/luxury-arcade-game-rentals"
                value={seoData.slug}
                onChange={handleInputChange}
              />
               <Input
                label="Canonical URL"
                name="canonicalUrl"
                placeholder="https://example.com/preferred-url"
                value={seoData.canonicalUrl}
                onChange={handleInputChange}
              />
              <Button onClick={handleSaveChanges} className="w-full mt-4">
                Save Changes
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SeoOptimizer;