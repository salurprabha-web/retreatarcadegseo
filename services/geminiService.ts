import { Operation } from "@google/genai";
import { SeoSuggestions, SiteSettings, KeywordIdeas, CompetitorAnalysis, SocialMediaPost, BrandKit, MarketingPersona, LocalSeoCopy, AdCopy, AbTestIdea, FaqItem, VideoScript, PressRelease, Email, AnalyticsReport, BlogPost, LeadAnalysis, Service, ContentPage, EventThemeIdea, InternalLinkSuggestion } from '../types';

// Helper function to call the server-side proxy
async function callGeminiProxy(action: string, payload: any): Promise<any> {
    const response = await fetch('/api/gemini-proxy', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, payload }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API call failed for action: ${action}`);
    }

    return response.json();
}

export const getSeoSuggestions = async (pageContent: string, focusKeywords: string): Promise<SeoSuggestions> => {
    return callGeminiProxy('getSeoSuggestions', { pageContent, focusKeywords });
};

export const generateImage = async (prompt: string): Promise<string> => {
    return callGeminiProxy('generateImage', { prompt });
};

export const editImage = async (imageDataBase64: string, prompt: string): Promise<string> => {
    return callGeminiProxy('editImage', { imageDataBase64, prompt });
};

export const getAltTextSuggestion = async (imageDataBase64: string): Promise<string> => {
    return callGeminiProxy('getAltTextSuggestion', { imageDataBase64 });
};

export const getServiceSeoSuggestions = async (serviceName: string, serviceDescription: string): Promise<Service['seo']> => {
    return callGeminiProxy('getServiceSeoSuggestions', { serviceName, serviceDescription });
};

export const generateServiceDetails = async (serviceName: string, serviceDescription: string): Promise<Pick<Service, 'long_description' | 'features' | 'specifications'>> => {
    return callGeminiProxy('generateServiceDetails', { serviceName, serviceDescription });
};

export const generateProductSchema = async (service: Service): Promise<string> => {
    return callGeminiProxy('generateProductSchema', { service });
};

export const getHighlightedQuote = async (testimonialText: string): Promise<string> => {
    return callGeminiProxy('getHighlightedQuote', { testimonialText });
};

export const generateBusinessSchema = async (settings: SiteSettings): Promise<string> => {
    return callGeminiProxy('generateBusinessSchema', { settings });
};

export const generateBlogPost = async (topic: string, tone: string): Promise<string> => {
    return callGeminiProxy('generateBlogPost', { topic, tone });
};

export const generateKeywordIdeas = async (topic: string): Promise<KeywordIdeas> => {
    return callGeminiProxy('generateKeywordIdeas', { topic });
};

export const analyzeCompetitor = async (url: string, description: string): Promise<CompetitorAnalysis> => {
    return callGeminiProxy('analyzeCompetitor', { url, description });
};

export const generateSocialMediaPosts = async (topic: string, platform: string, cta: string): Promise<SocialMediaPost[]> => {
    return callGeminiProxy('generateSocialMediaPosts', { topic, platform, cta });
};

export const generateBrandKit = async (description: string): Promise<BrandKit> => {
    return callGeminiProxy('generateBrandKit', { description });
};

export const generateMarketingPersona = async (businessDescription: string, targetAudience: string): Promise<MarketingPersona> => {
    return callGeminiProxy('generateMarketingPersona', { businessDescription, targetAudience });
};

export const generateLocalSeoCopy = async (targetLocation: string, services: string): Promise<LocalSeoCopy> => {
    return callGeminiProxy('generateLocalSeoCopy', { targetLocation, services });
};

export const generateAdCopy = async (product: string, talkingPoints: string, platform: string, audience: string): Promise<AdCopy> => {
    return callGeminiProxy('generateAdCopy', { product, talkingPoints, platform, audience });
};

export const generateAbTestIdeas = async (pageDescription: string, pageGoal: string, elementToTest: string): Promise<AbTestIdea[]> => {
    return callGeminiProxy('generateAbTestIdeas', { pageDescription, pageGoal, elementToTest });
};

export const generateFaqs = async (pageTopic: string, audience: string): Promise<FaqItem[]> => {
    return callGeminiProxy('generateFaqs', { pageTopic, audience });
};

export const generateFaqPageSchema = async (faqs: FaqItem[]): Promise<string> => {
    return callGeminiProxy('generateFaqPageSchema', { faqs });
};

export const generateVideoScript = async (topic: string, style: string, talkingPoints: string): Promise<VideoScript> => {
    return callGeminiProxy('generateVideoScript', { topic, style, talkingPoints });
};

export const generatePressRelease = async (announcement: string, keyPoints: string): Promise<PressRelease> => {
    return callGeminiProxy('generatePressRelease', { announcement, keyPoints });
};

export const generateEmailCampaign = async (goal: string, audience: string, emailCount: number, tone: string): Promise<Email[]> => {
    return callGeminiProxy('generateEmailCampaign', { goal, audience, emailCount, tone });
};

export const generateAnalyticsReport = async (timePeriod: string, metricsData: string): Promise<AnalyticsReport> => {
    return callGeminiProxy('generateAnalyticsReport', { timePeriod, metricsData });
};

export const generateFullBlogPost = async (topic: string, keywords: string, tone: string): Promise<Omit<BlogPost, 'id' | 'publish_date' | 'status' | 'created_at'>> => {
    return callGeminiProxy('generateFullBlogPost', { topic, keywords, tone });
};

export const analyzeAndRespondToLead = async (leadMessage: string): Promise<LeadAnalysis> => {
    return callGeminiProxy('analyzeAndRespondToLead', { leadMessage });
};

export const generatePageContent = async (pageTitle: string): Promise<string> => {
    return callGeminiProxy('generatePageContent', { pageTitle });
};

export const generateRobotsTxt = async (): Promise<string> => {
    return callGeminiProxy('generateRobotsTxt', {});
};

export const generateEventThemeIdea = async (theme: string, serviceNames: string[]): Promise<EventThemeIdea> => {
    return callGeminiProxy('generateEventThemeIdea', { theme, serviceNames });
};

export const generateVideo = async (prompt: string, aspectRatio: '16:9' | '9:16'): Promise<Operation<any>> => {
    return callGeminiProxy('generateVideo', { prompt, aspectRatio });
};

export const getVideoOperation = async (operation: Operation<any>): Promise<Operation<any>> => {
    return callGeminiProxy('getVideoOperation', { operation });
};

export const generateInternalLinks = async (content: string, potentialLinks: { title: string; url: string }[]): Promise<InternalLinkSuggestion[]> => {
    return callGeminiProxy('generateInternalLinks', { content, potentialLinks });
};

export const testApiKey = async (): Promise<{ success: boolean; message: string }> => {
    return callGeminiProxy('testApiKey', {});
};
