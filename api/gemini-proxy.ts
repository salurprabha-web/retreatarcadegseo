

// FIX: Import GenerateVideosResponse from @google/genai to use as a type argument for Operation.
import { GoogleGenAI, Type, Modality, Operation, GenerateVideosResponse } from "@google/genai";
import { SeoSuggestions, SiteSettings, KeywordIdeas, CompetitorAnalysis, SocialMediaPost, BrandKit, MarketingPersona, LocalSeoCopy, AdCopy, AbTestIdea, FaqItem, VideoScript, PressRelease, Email, AnalyticsReport, BlogPost, LeadAnalysis, Service, ContentPage, EventThemeIdea, InternalLinkSuggestion } from '../types';

// Helper to get the API key from common environment variable names
const getApiKey = (): string | undefined => {
    return process.env.GEMINI_API_KEY || process.env.API_KEY;
};

// This is the Vercel Serverless Function handler
export default async function handler(request: Request) {
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
    }
    
    let requestBody;
    try {
        requestBody = await request.json();
        const { action, payload } = requestBody;

        if (action === 'getDebugInfo') {
            const geminiApiKey = process.env.GEMINI_API_KEY;
            const apiKey = process.env.API_KEY;
            let apiKeyStatus;

            if (geminiApiKey && geminiApiKey.length > 5) {
                apiKeyStatus = `Found GEMINI_API_KEY. Starts with: ${geminiApiKey.substring(0, 5)}...`;
            } else if (apiKey && apiKey.length > 5) {
                apiKeyStatus = `Found API_KEY. Starts with: ${apiKey.substring(0, 5)}...`;
            } else {
                apiKeyStatus = 'Neither GEMINI_API_KEY nor API_KEY environment variables are set on the server.';
            }
            return new Response(JSON.stringify({ apiKeyStatus }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        // Handle video blob fetching separately as it returns a different content type
        if (action === 'getVideoBlobAsBase64') {
             const result = await getVideoBlobAsBase64Logic(payload.downloadLink);
             return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json' }});
        }

        const apiKey = getApiKey();
        if (!apiKey) {
            throw new Error("Neither GEMINI_API_KEY nor API_KEY is set in the server environment variables.");
        }
        const ai = new GoogleGenAI({ apiKey });

        let result;

        switch (action) {
            case 'getSeoSuggestions':
                result = await getSeoSuggestionsLogic(ai, payload.pageContent, payload.focusKeywords);
                break;
            case 'generateImage':
                result = await generateImageLogic(ai, payload.prompt);
                break;
            case 'editImage':
                 result = await editImageLogic(ai, payload.imageDataBase64, payload.prompt);
                 break;
            case 'getAltTextSuggestion':
                result = await getAltTextSuggestionLogic(ai, payload.imageDataBase64);
                break;
            case 'getServiceSeoSuggestions':
                result = await getServiceSeoSuggestionsLogic(ai, payload.serviceName, payload.serviceDescription);
                break;
            case 'generateServiceDetails':
                result = await generateServiceDetailsLogic(ai, payload.serviceName, payload.serviceDescription);
                break;
            case 'generateProductSchema':
                 result = await generateProductSchemaLogic(ai, payload.service);
                 break;
            case 'getHighlightedQuote':
                result = await getHighlightedQuoteLogic(ai, payload.testimonialText);
                break;
            case 'generateBusinessSchema':
                 result = await generateBusinessSchemaLogic(ai, payload.settings);
                 break;
            case 'generateBlogPost':
                 result = await generateBlogPostLogic(ai, payload.topic, payload.tone);
                 break;
            case 'generateKeywordIdeas':
                 result = await generateKeywordIdeasLogic(ai, payload.topic);
                 break;
            case 'analyzeCompetitor':
                 result = await analyzeCompetitorLogic(ai, payload.url, payload.description);
                 break;
            case 'generateSocialMediaPosts':
                 result = await generateSocialMediaPostsLogic(ai, payload.topic, payload.platform, payload.cta);
                 break;
            case 'generateBrandKit':
                 result = await generateBrandKitLogic(ai, payload.description);
                 break;
            case 'generateMarketingPersona':
                result = await generateMarketingPersonaLogic(ai, payload.businessDescription, payload.targetAudience);
                break;
            case 'generateLocalSeoCopy':
                result = await generateLocalSeoCopyLogic(ai, payload.targetLocation, payload.services);
                break;
            case 'generateAdCopy':
                result = await generateAdCopyLogic(ai, payload.product, payload.talkingPoints, payload.platform, payload.audience);
                break;
            case 'generateAbTestIdeas':
                result = await generateAbTestIdeasLogic(ai, payload.pageDescription, payload.pageGoal, payload.elementToTest);
                break;
            case 'generateFaqs':
                result = await generateFaqsLogic(ai, payload.pageTopic, payload.audience);
                break;
            case 'generateFaqPageSchema':
                result = await generateFaqPageSchemaLogic(ai, payload.faqs);
                break;
            case 'generateVideoScript':
                result = await generateVideoScriptLogic(ai, payload.topic, payload.style, payload.talkingPoints);
                break;
            case 'generatePressRelease':
                result = await generatePressReleaseLogic(ai, payload.announcement, payload.keyPoints);
                break;
            case 'generateEmailCampaign':
                result = await generateEmailCampaignLogic(ai, payload.goal, payload.audience, payload.emailCount, payload.tone);
                break;
            case 'generateAnalyticsReport':
                result = await generateAnalyticsReportLogic(ai, payload.timePeriod, payload.metricsData);
                break;
            case 'generateFullBlogPost':
                result = await generateFullBlogPostLogic(ai, payload.topic, payload.keywords, payload.tone);
                break;
            case 'analyzeAndRespondToLead':
                result = await analyzeAndRespondToLeadLogic(ai, payload.leadMessage);
                break;
            case 'generatePageContent':
                result = await generatePageContentLogic(ai, payload.pageTitle);
                break;
            case 'generateRobotsTxt':
                result = await generateRobotsTxtLogic(ai);
                break;
            case 'generateEventThemeIdea':
                result = await generateEventThemeIdeaLogic(ai, payload.theme, payload.serviceNames);
                break;
            case 'generateVideo':
                result = await generateVideoLogic(ai, payload.prompt, payload.aspectRatio);
                break;
            case 'getVideoOperation':
                result = await getVideoOperationLogic(ai, payload.operation);
                break;
            case 'validateApiKey':
                result = await validateApiKeyLogic(ai);
                break;
            case 'generateInternalLinks':
                result = await generateInternalLinksLogic(ai, payload.content, payload.potentialLinks);
                break;
            default:
                throw new Error(`Unknown action: ${action}`);
        }

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        const action = requestBody?.action || 'unknown';
        console.error(`Error in gemini-proxy for action "${action}":`, error);
        return new Response(JSON.stringify({ error: error.message || 'An internal server error occurred.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}

const getVideoBlobAsBase64Logic = async (downloadLink: string): Promise<{ base64: string, mimeType: string }> => {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API key not found on server.");
    const response = await fetch(`${downloadLink}&key=${apiKey}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch video from Google. Status: ${response.status} ${await response.text()}`);
    }
    const blob = await response.blob();
    const buffer = await blob.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    return { base64, mimeType: blob.type };
};

const parseJsonResponse = (text: string) => {
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    try {
        return JSON.parse(cleanedText);
    } catch (e) {
        console.error("Failed to parse JSON response from AI:", cleanedText);
        throw new Error("The AI returned a response that was not valid JSON.");
    }
}

const getSeoSuggestionsLogic = async (ai: GoogleGenAI, pageContent: string, focusKeywords: string): Promise<SeoSuggestions> => {
    const prompt = `Act as a world-class SEO expert for "Retreat Arcade", a luxury event rental business. Analyze the following page content and focus keywords. Generate SEO-optimized metadata. The title should be engaging, under 60 characters. The description compelling, under 160 characters. The keywords should include a mix of focus and long-tail keywords. Return ONLY a raw JSON object with keys "title" (string), "description" (string), and "keywords" (an array of strings). Do not wrap it in markdown. Page Content: --- ${pageContent} --- Focus Keywords: --- ${focusKeywords} ---`;
    const response = await ai.models.generateContent({model: "gemini-2.5-flash", contents: prompt, config: { temperature: 0.7 }});
    return parseJsonResponse(response.text);
};

const generateImageLogic = async (ai: GoogleGenAI, prompt: string): Promise<string> => {
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts: [{ text: prompt }] }, config: { responseModalities: [Modality.IMAGE] } });
    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
    }
    throw new Error("No image data found in the response.");
};

const editImageLogic = async (ai: GoogleGenAI, imageDataBase64: string, prompt: string): Promise<string> => {
    if (!imageDataBase64) throw new Error("No image data provided to edit.");
    const mimeTypeMatch = imageDataBase64.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);
    if (!mimeTypeMatch || mimeTypeMatch.length < 2) throw new Error("Invalid image data format.");
    const mimeType = mimeTypeMatch[1];
    const base64Data = imageDataBase64.split(',')[1];
    const imagePart = { inlineData: { mimeType, data: base64Data } };
    const textPart = { text: prompt };
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts: [imagePart, textPart] }, config: { responseModalities: [Modality.IMAGE] } });
    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
    }
    throw new Error("No edited image data found in the response.");
};

const getAltTextSuggestionLogic = async (ai: GoogleGenAI, imageDataBase64: string): Promise<string> => {
    if (!imageDataBase64) throw new Error("No image data provided.");
    const mimeTypeMatch = imageDataBase64.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);
    if (!mimeTypeMatch || mimeTypeMatch.length < 2) throw new Error("Invalid image data format.");
    const mimeType = mimeTypeMatch[1];
    const base64Data = imageDataBase64.split(',')[1];
    const imagePart = { inlineData: { mimeType, data: base64Data } };
    const textPart = { text: `Analyze this image from "Retreat Arcade". Generate a concise, descriptive, SEO-friendly alt text under 125 characters, incorporating relevant keywords like "luxury event", "arcade game rental" if appropriate. Do not include "Image of". Return only the alt text string.` };
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: { parts: [imagePart, textPart] } });
    return response.text.trim().replace(/"/g, '');
};

const getServiceSeoSuggestionsLogic = async (ai: GoogleGenAI, serviceName: string, serviceDescription: string): Promise<Service['seo']> => {
    const prompt = `Generate SEO metadata for a luxury event rental service. Service Name: ${serviceName}. Description: ${serviceDescription}. Create a meta title, meta description, and a URL slug. Return ONLY a raw JSON object with keys "metaTitle", "metaDescription", and "slug". Do not wrap it in markdown.`;
    const response = await ai.models.generateContent({model: 'gemini-2.5-flash', contents: prompt});
    return parseJsonResponse(response.text);
};

const generateServiceDetailsLogic = async (ai: GoogleGenAI, serviceName: string, serviceDescription: string): Promise<Pick<Service, 'long_description' | 'features' | 'specifications'>> => {
    const prompt = `Generate detailed content for a luxury event rental service. Service Name: ${serviceName}. Description: ${serviceDescription}. Create a long description, a list of 5 key features, and a list of 4 technical specifications (each spec should be an object with "key" and "value" properties). Return ONLY a raw JSON object with keys "long_description", "features", and "specifications". Do not wrap it in markdown.`;
    const response = await ai.models.generateContent({model: 'gemini-2.5-flash', contents: prompt});
    return parseJsonResponse(response.text);
};

const generateProductSchemaLogic = async (ai: GoogleGenAI, service: Service): Promise<string> => {
    const prompt = `Generate a JSON-LD script for a "Product" schema for: ${service.name}, Description: ${service.long_description}, Brand: Retreat Arcade, Price: ${service.price}, Image: ${service.image_url}`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt });
    return response.text;
};

const getHighlightedQuoteLogic = async (ai: GoogleGenAI, testimonialText: string): Promise<string> => {
    const prompt = `Analyze this testimonial and extract the most impactful quote (under 150 characters). Return only the quote string.\n\nTestimonial: "${testimonialText}"`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text.trim().replace(/"/g, '');
};

const generateBusinessSchemaLogic = async (ai: GoogleGenAI, settings: SiteSettings): Promise<string> => {
    const prompt = `Generate a JSON-LD script for a "LocalBusiness" schema using these details:\n\n${JSON.stringify(settings, null, 2)}`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt });
    return response.text;
};

const generateBlogPostLogic = async (ai: GoogleGenAI, topic: string, tone: string): Promise<string> => {
    const prompt = `Write a 500-word blog post for "Retreat Arcade". Tone: ${tone}. Topic: "${topic}". Format as Markdown.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt });
    return response.text;
};

const generateKeywordIdeasLogic = async (ai: GoogleGenAI, topic: string): Promise<KeywordIdeas> => {
    const prompt = `Generate keyword ideas for the topic: "${topic}". Provide long-tail keywords, question-based keywords, and related content topics. Return ONLY a raw JSON object with keys "longTailKeywords", "questionKeywords", and "relatedTopics", where each key holds an array of strings. Do not wrap it in markdown.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return parseJsonResponse(response.text);
};

const analyzeCompetitorLogic = async (ai: GoogleGenAI, url: string, description: string): Promise<CompetitorAnalysis> => {
    const prompt = `Analyze competitor for Retreat Arcade. URL: ${url}. Description: ${description}. Analyze SEO strengths, content strategy, tone, and opportunities. Return ONLY a raw JSON object with keys "seoStrengths" (array of strings), "contentStrategy" (array of strings), "toneOfVoice" (string), and "opportunities" (array of strings). Do not wrap it in markdown.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt });
    return parseJsonResponse(response.text);
};

const generateSocialMediaPostsLogic = async (ai: GoogleGenAI, topic: string, platform: string, cta: string): Promise<SocialMediaPost[]> => {
    const prompt = `Generate 3 distinct social media posts for ${platform}. Topic: "${topic}". Brand: "Retreat Arcade". Optional CTA: "${cta}". Return ONLY a raw JSON object which is an array of objects. Each object should have keys "copy" (string) and "hashtags" (array of strings). Do not wrap it in markdown.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return parseJsonResponse(response.text);
};

const generateBrandKitLogic = async (ai: GoogleGenAI, description: string): Promise<BrandKit> => {
    const prompt = `Generate a brand kit for a business with this description: "${description}". Include mission, 3 values, brand voice, 4 taglines, and a 5-color palette. Return ONLY a raw JSON object with keys "missionStatement" (string), "coreValues" (array of strings), "brandVoice" (string), "taglines" (array of strings), and "colorPalette" (an array of objects, each with "name", "hex", and "description" string keys). Do not wrap it in markdown.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt });
    return parseJsonResponse(response.text);
};

const generateMarketingPersonaLogic = async (ai: GoogleGenAI, businessDescription: string, targetAudience: string): Promise<MarketingPersona> => {
    const prompt = `Create a marketing persona for: "${businessDescription}". Audience: "${targetAudience}". Include name, photo description, demographics, goals, pain points, watering holes, and marketing message. Return ONLY a raw JSON object with keys "name" (string), "photoDescription" (string), "demographics" (object with "age", "jobTitle", "location" strings), "goals" (array of strings), "painPoints" (array of strings), "wateringHoles" (array of strings), and "marketingMessage" (string). Do not wrap it in markdown.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt });
    return parseJsonResponse(response.text);
};

const generateLocalSeoCopyLogic = async (ai: GoogleGenAI, targetLocation: string, services: string): Promise<LocalSeoCopy> => {
    const prompt = `Generate local SEO content for Retreat Arcade targeting "${targetLocation}". Services: ${services}. Create a GBP description, 2 example GBP posts, a local landing page intro, and local keywords. Return ONLY a raw JSON object with keys "gbpDescription" (string), "gbpPosts" (array of objects with "title" and "content" strings), "landingPageIntro" (string), and "localKeywords" (array of strings). Do not wrap it in markdown.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt });
    return parseJsonResponse(response.text);
};

const generateAdCopyLogic = async (ai: GoogleGenAI, product: string, talkingPoints: string, platform: string, audience: string): Promise<AdCopy> => {
    const prompt = `Generate ad copy for "Retreat Arcade". Platform: ${platform}, Product: ${product}, Audience: ${audience}, Talking Points: ${talkingPoints}. If Google, provide 3 headlines (<30 chars) & 2 descriptions (<90 chars). If Facebook, 2 primary texts, 3 headlines, 3 CTAs. Return a JSON object with 'googleAds' or 'facebookAds' key.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return parseJsonResponse(response.text);
};

const generateAbTestIdeasLogic = async (ai: GoogleGenAI, pageDescription: string, pageGoal: string, elementToTest: string): Promise<AbTestIdea[]> => {
    const prompt = `Generate 3 A/B test ideas. Page: ${pageDescription}. Goal: ${pageGoal}. Element: ${elementToTest}. Return ONLY a raw JSON object which is an array of objects. Each object should have keys "hypothesis", "variantA", "variantB", and "primaryMetric" (all strings). Do not wrap it in markdown.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt });
    return parseJsonResponse(response.text);
};

const generateFaqsLogic = async (ai: GoogleGenAI, pageTopic: string, audience: string): Promise<FaqItem[]> => {
    const prompt = `Generate 5 FAQs and answers for a webpage about "${pageTopic}", for audience "${audience}". Return ONLY a raw JSON object which is an array of objects. Each object should have keys "question" and "answer" (both strings). Do not wrap it in markdown.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return parseJsonResponse(response.text);
};

const generateFaqPageSchemaLogic = async (ai: GoogleGenAI, faqs: FaqItem[]): Promise<string> => {
    const prompt = `Create a valid JSON-LD script for FAQPage structured data from these FAQs:\n${JSON.stringify(faqs, null, 2)}`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt });
    return response.text.replace(/```json/g, '').replace(/```/g, '');
};

const generateVideoScriptLogic = async (ai: GoogleGenAI, topic: string, style: string, talkingPoints: string): Promise<VideoScript> => {
    const prompt = `Generate a video script. Topic: ${topic}. Style: ${style}. Points: ${talkingPoints}. Create a title and scenes with visuals, voiceover, and optional on-screen text. Return ONLY a raw JSON object with keys "title" (string) and "scenes" (array of objects with "sceneNumber" (integer), "visual" (string), "voiceover" (string), and optional "onScreenText" (string)). Do not wrap it in markdown.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt });
    return parseJsonResponse(response.text);
};

const generatePressReleaseLogic = async (ai: GoogleGenAI, announcement: string, keyPoints: string): Promise<PressRelease> => {
    const prompt = `Write a press release for Retreat Arcade. Announcement: ${announcement}. Key points: ${keyPoints}. Include boilerplate and contact info. Return ONLY a raw JSON object with keys "headline", "dateline", "introduction", "body", "boilerplate", and "contactInfo" (all strings). Do not wrap it in markdown.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt });
    return parseJsonResponse(response.text);
};

const generateEmailCampaignLogic = async (ai: GoogleGenAI, goal: string, audience: string, emailCount: number, tone: string): Promise<Email[]> => {
    const prompt = `Generate an email campaign of ${emailCount} emails. Goal: ${goal}. Audience: ${audience}. Tone: ${tone}. Provide subject and body for each. Return ONLY a raw JSON object which is an array of objects, each with "subject" and "body" string keys. Do not wrap it in markdown.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt });
    return parseJsonResponse(response.text);
};

const generateAnalyticsReportLogic = async (ai: GoogleGenAI, timePeriod: string, metricsData: string): Promise<AnalyticsReport> => {
    const prompt = `Analyze website metrics for "${timePeriod}" and generate a report. Data:\n${metricsData}\n\nReturn ONLY a raw JSON object with keys "reportTitle" (string), "executiveSummary" (string), "keyWins" (array of strings), "areasForImprovement" (array of strings), and "actionableRecommendations" (array of strings). Do not wrap it in markdown.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt });
    return parseJsonResponse(response.text);
};

const generateFullBlogPostLogic = async (ai: GoogleGenAI, topic: string, keywords: string, tone: string): Promise<Omit<BlogPost, 'id' | 'publish_date' | 'status' | 'created_at'>> => {
    const prompt = `Generate a full blog post about "${topic}", with keywords "${keywords}". Tone: ${tone}. Return ONLY a raw JSON object with "title" (string), "content" (string, full blog post in Markdown), and "seo" (an object with "metaTitle", "metaDescription", and "slug" string keys). Do not wrap it in markdown.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt });
    return parseJsonResponse(response.text);
};

const analyzeAndRespondToLeadLogic = async (ai: GoogleGenAI, leadMessage: string): Promise<LeadAnalysis> => {
    const prompt = `Analyze this lead for "Retreat Arcade". Analyze summary, intent, quality, and draft a reply. Lead:\n\n${leadMessage}\n\nReturn ONLY a raw JSON object with keys "summary" (string), "intent" (enum: 'Booking Inquiry', 'Question', 'Partnership', 'Spam', 'Other'), "quality" (enum: 'Hot', 'Warm', 'Cold'), and "suggestedReply" (string). Do not wrap it in markdown.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return parseJsonResponse(response.text);
};

const generatePageContentLogic = async (ai: GoogleGenAI, pageTitle: string): Promise<string> => {
    const prompt = `Write body content for a webpage titled "${pageTitle}" for "Retreat Arcade". Use Markdown.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt });
    return response.text;
};

const generateRobotsTxtLogic = async (ai: GoogleGenAI): Promise<string> => {
    const prompt = `Generate a standard robots.txt file for a website. It should allow all user-agents to crawl the entire site. It must also specify the sitemap location, which is at the absolute path /api/sitemap.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text;
};

const generateEventThemeIdeaLogic = async (ai: GoogleGenAI, theme: string, serviceNames: string[]): Promise<EventThemeIdea> => {
    const prompt = `Generate an event blueprint for theme "${theme}". Create a tagline. Suggest a package of 2-3 services from [${serviceNames.join(', ')}] with reasons. Provide 2 social media campaign ideas. Return ONLY a raw JSON object with "tagline" (string), "suggestedPackage" (array of objects with "serviceName" and "reason" strings), and "socialMediaCampaign" (array of objects with "platform" and "postIdea" strings). Do not wrap it in markdown.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt });
    return parseJsonResponse(response.text);
};

// FIX: The Operation type is generic and requires a type argument. For video generation, it should be Operation<GenerateVideosResponse>.
const generateVideoLogic = async (ai: GoogleGenAI, prompt: string, aspectRatio: '16:9' | '9:16'): Promise<Operation<GenerateVideosResponse>> => {
    const operation = await ai.models.generateVideos({ model: 'veo-3.1-fast-generate-preview', prompt, config: { numberOfVideos: 1, resolution: '720p', aspectRatio } });
    return operation;
};

// FIX: The Operation type is generic and requires a type argument. For video generation, it should be Operation<GenerateVideosResponse>.
const getVideoOperationLogic = async (ai: GoogleGenAI, operation: Operation<GenerateVideosResponse>): Promise<Operation<GenerateVideosResponse>> => {
    const updatedOperation = await ai.operations.getVideosOperation({ operation });
    return updatedOperation;
};

const validateApiKeyLogic = async (ai: GoogleGenAI): Promise<{ success: boolean, message: string }> => {
    try {
        await ai.models.list();
        return { success: true, message: 'Your API key is valid and successfully connected to the Gemini API.' };
    } catch (error: any) {
        console.error("API Key Validation Error:", error.message);
        throw new Error(error.message);
    }
};

const generateInternalLinksLogic = async (ai: GoogleGenAI, content: string, potentialLinks: { title: string; url: string }[]): Promise<InternalLinkSuggestion[]> => {
    const prompt = `Act as an SEO strategist. Analyze the blog post content below and identify 3-5 natural opportunities to add internal links from the provided list. The anchor text must exist in the content. Return ONLY a raw JSON array of suggestions, where each object has "anchorText", "suggestedUrl", and "explanation" string keys. Do not wrap it in markdown. Content: --- ${content} --- Available links: --- ${potentialLinks.map(l => `- Title: "${l.title}", URL: "${l.url}"`).join('\n')} ---`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt });
    return parseJsonResponse(response.text);
};
