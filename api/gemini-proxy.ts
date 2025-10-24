import { GoogleGenAI, Type, Modality, Operation } from "@google/genai";
import { SeoSuggestions, SiteSettings, KeywordIdeas, CompetitorAnalysis, SocialMediaPost, BrandKit, MarketingPersona, LocalSeoCopy, AdCopy, AbTestIdea, FaqItem, VideoScript, PressRelease, Email, AnalyticsReport, BlogPost, LeadAnalysis, Service, ContentPage, EventThemeIdea, InternalLinkSuggestion } from '../types';

// Schemas are defined inside the handler or called from a separate file
// For simplicity in this proxy, they are redefined within the logic functions.

// This is the Vercel Serverless Function handler
export default async function handler(request: Request) {
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
    }

    try {
        const { action, payload } = await request.json();
        
        // Initialize AI client inside the handler using the server-side environment variable.
        if (!process.env.API_KEY) {
            throw new Error("API_KEY environment variable is not set in your hosting environment. This is required for all AI features to work.");
        }
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        let result;

        switch (action) {
            // Each case corresponds to a function in the original geminiService
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
            case 'generateInternalLinks':
                result = await generateInternalLinksLogic(ai, payload.content, payload.potentialLinks);
                break;
            case 'testApiKey':
                result = await testApiKeyLogic(ai);
                break;
            default:
                return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error(`Error in gemini-proxy:`, error);
        return new Response(JSON.stringify({ error: error.message || 'An internal server error occurred' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}

// All logic functions from the original geminiService are moved here.
// They now accept an initialized `GoogleGenAI` instance as the first argument.

const getSeoSuggestionsLogic = async (ai: GoogleGenAI, pageContent: string, focusKeywords: string): Promise<SeoSuggestions> => {
    const responseSchema = {type: Type.OBJECT,properties: {title: {type: Type.STRING}, description: {type: Type.STRING}, keywords: {type: Type.ARRAY,items: {type: Type.STRING}}},required: ["title", "description", "keywords"]};
    const prompt = `Act as a world-class SEO expert for "Retreat Arcade", a luxury event rental business. Analyze the following page content and focus keywords. Generate a JSON object with SEO-optimized metadata. Page Content: --- ${pageContent} --- Focus Keywords: --- ${focusKeywords} --- The title should be engaging, under 60 characters. The description compelling, under 160 characters. The keywords should include a mix of focus and long-tail keywords.`;
    const response = await ai.models.generateContent({model: "gemini-2.5-flash", contents: prompt, config: {responseMimeType: "application/json", responseSchema, temperature: 0.7}});
    return JSON.parse(response.text.trim());
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
    const schema = {type: Type.OBJECT, properties: {metaTitle: {type: Type.STRING}, metaDescription: {type: Type.STRING}, slug: {type: Type.STRING}}, required: ["metaTitle", "metaDescription", "slug"]};
    const prompt = `Generate SEO metadata for a luxury event rental service. Service Name: ${serviceName}. Description: ${serviceDescription}. Create a meta title, meta description, and a URL slug.`;
    const response = await ai.models.generateContent({model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema }});
    return JSON.parse(response.text);
};

const generateServiceDetailsLogic = async (ai: GoogleGenAI, serviceName: string, serviceDescription: string): Promise<Pick<Service, 'long_description' | 'features' | 'specifications'>> => {
    const schema = {type: Type.OBJECT, properties: {long_description: { type: Type.STRING }, features: { type: Type.ARRAY, items: { type: Type.STRING } }, specifications: {type: Type.ARRAY, items: {type: Type.OBJECT, properties: {key: { type: Type.STRING }, value: { type: Type.STRING }}, required: ["key", "value"]}}}, required: ["long_description", "features", "specifications"]};
    const prompt = `Generate detailed content for a luxury event rental service. Service Name: ${serviceName}. Description: ${serviceDescription}. Create a long description, a list of 5 key features, and a list of 4 technical specifications.`;
    const response = await ai.models.generateContent({model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema }});
    return JSON.parse(response.text);
};

const generateProductSchemaLogic = async (ai: GoogleGenAI, service: Service): Promise<string> => {
    const prompt = `Generate a JSON-LD script for a "Product" schema for: ${service.name}, Description: ${service.long_description}, Brand: Retreat Arcade, Price: ${service.price}, Image: ${service.image_url}`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text;
};

const getHighlightedQuoteLogic = async (ai: GoogleGenAI, testimonialText: string): Promise<string> => {
    const prompt = `Analyze this testimonial and extract the most impactful quote (under 150 characters). Return only the quote string.\n\nTestimonial: "${testimonialText}"`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text.trim().replace(/"/g, '');
};

const generateBusinessSchemaLogic = async (ai: GoogleGenAI, settings: SiteSettings): Promise<string> => {
    const prompt = `Generate a JSON-LD script for a "LocalBusiness" schema using these details:\n\n${JSON.stringify(settings, null, 2)}`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text;
};

const generateBlogPostLogic = async (ai: GoogleGenAI, topic: string, tone: string): Promise<string> => {
    const prompt = `Write a 500-word blog post for "Retreat Arcade". Tone: ${tone}. Topic: "${topic}". Format as Markdown.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text;
};

const generateKeywordIdeasLogic = async (ai: GoogleGenAI, topic: string): Promise<KeywordIdeas> => {
    const schema = {type: Type.OBJECT, properties: {longTailKeywords: { type: Type.ARRAY, items: { type: Type.STRING } }, questionKeywords: { type: Type.ARRAY, items: { type: Type.STRING } }, relatedTopics: { type: Type.ARRAY, items: { type: Type.STRING } }}, required: ["longTailKeywords", "questionKeywords", "relatedTopics"]};
    const prompt = `Generate keyword ideas for the topic: "${topic}". Provide long-tail keywords, question-based keywords, and related content topics.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
    return JSON.parse(response.text);
};

const analyzeCompetitorLogic = async (ai: GoogleGenAI, url: string, description: string): Promise<CompetitorAnalysis> => {
    const schema = {type: Type.OBJECT, properties: {seoStrengths: { type: Type.ARRAY, items: { type: Type.STRING } }, contentStrategy: { type: Type.ARRAY, items: { type: Type.STRING } }, toneOfVoice: { type: Type.STRING }, opportunities: { type: Type.ARRAY, items: { type: Type.STRING } }}, required: ["seoStrengths", "contentStrategy", "toneOfVoice", "opportunities"]};
    const prompt = `Analyze competitor for Retreat Arcade. URL: ${url}. Description: ${description}. Analyze SEO strengths, content strategy, tone, and opportunities.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
    return JSON.parse(response.text);
};

const generateSocialMediaPostsLogic = async (ai: GoogleGenAI, topic: string, platform: string, cta: string): Promise<SocialMediaPost[]> => {
    const schema = {type: Type.ARRAY, items: {type: Type.OBJECT, properties: {copy: { type: Type.STRING }, hashtags: { type: Type.ARRAY, items: { type: Type.STRING } }}, required: ["copy", "hashtags"]}};
    const prompt = `Generate 3 distinct social media posts for ${platform}. Topic: "${topic}". Brand: "Retreat Arcade". Optional CTA: "${cta}".`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
    return JSON.parse(response.text);
};

const generateBrandKitLogic = async (ai: GoogleGenAI, description: string): Promise<BrandKit> => {
    const schema = {type: Type.OBJECT, properties: {missionStatement: { type: Type.STRING }, coreValues: { type: Type.ARRAY, items: { type: Type.STRING } }, brandVoice: { type: Type.STRING }, taglines: { type: Type.ARRAY, items: { type: Type.STRING } }, colorPalette: {type: Type.ARRAY, items: {type: Type.OBJECT, properties: {name: { type: Type.STRING }, hex: { type: Type.STRING }, description: { type: Type.STRING }}, required: ["name", "hex", "description"]}}}, required: ["missionStatement", "coreValues", "brandVoice", "taglines", "colorPalette"]};
    const prompt = `Generate a brand kit for a business with this description: "${description}". Include mission, 3 values, brand voice, 4 taglines, and a 5-color palette.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
    return JSON.parse(response.text);
};

const generateMarketingPersonaLogic = async (ai: GoogleGenAI, businessDescription: string, targetAudience: string): Promise<MarketingPersona> => {
    const schema = {type: Type.OBJECT, properties: {name: { type: Type.STRING }, photoDescription: { type: Type.STRING }, demographics: {type: Type.OBJECT, properties: { age: { type: Type.STRING }, jobTitle: { type: Type.STRING }, location: { type: Type.STRING } }, required: ["age", "jobTitle", "location"]}, goals: { type: Type.ARRAY, items: { type: Type.STRING } }, painPoints: { type: Type.ARRAY, items: { type: Type.STRING } }, wateringHoles: { type: Type.ARRAY, items: { type: Type.STRING } }, marketingMessage: { type: Type.STRING }}, required: ["name", "photoDescription", "demographics", "goals", "painPoints", "wateringHoles", "marketingMessage"]};
    const prompt = `Create a marketing persona for: "${businessDescription}". Audience: "${targetAudience}". Include name, photo description, demographics, goals, pain points, watering holes, and marketing message.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
    return JSON.parse(response.text);
};

const generateLocalSeoCopyLogic = async (ai: GoogleGenAI, targetLocation: string, services: string): Promise<LocalSeoCopy> => {
    const schema = {type: Type.OBJECT, properties: {gbpDescription: { type: Type.STRING }, gbpPosts: {type: Type.ARRAY, items: {type: Type.OBJECT, properties: { title: { type: Type.STRING }, content: { type: Type.STRING } }, required: ["title", "content"]}}, landingPageIntro: { type: Type.STRING }, localKeywords: { type: Type.ARRAY, items: { type: Type.STRING } }}, required: ["gbpDescription", "gbpPosts", "landingPageIntro", "localKeywords"]};
    const prompt = `Generate local SEO content for Retreat Arcade targeting "${targetLocation}". Services: ${services}. Create a GBP description, 2 example GBP posts, a local landing page intro, and local keywords.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
    return JSON.parse(response.text);
};

const generateAdCopyLogic = async (ai: GoogleGenAI, product: string, talkingPoints: string, platform: string, audience: string): Promise<AdCopy> => {
    const prompt = `Generate ad copy for "Retreat Arcade". Platform: ${platform}, Product: ${product}, Audience: ${audience}, Talking Points: ${talkingPoints}. If Google, provide 3 headlines (<30 chars) & 2 descriptions (<90 chars). If Facebook, 2 primary texts, 3 headlines, 3 CTAs. Return a JSON object with 'googleAds' or 'facebookAds' key.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    const text = response.text.replace(/```json/g, '').replace(/```/g, '');
    return JSON.parse(text);
};

const generateAbTestIdeasLogic = async (ai: GoogleGenAI, pageDescription: string, pageGoal: string, elementToTest: string): Promise<AbTestIdea[]> => {
    const schema = {type: Type.ARRAY, items: {type: Type.OBJECT, properties: {hypothesis: { type: Type.STRING }, variantA: { type: Type.STRING }, variantB: { type: Type.STRING }, primaryMetric: { type: Type.STRING }}, required: ["hypothesis", "variantA", "variantB", "primaryMetric"]}};
    const prompt = `Generate 3 A/B test ideas. Page: ${pageDescription}. Goal: ${pageGoal}. Element: ${elementToTest}.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
    return JSON.parse(response.text);
};

const generateFaqsLogic = async (ai: GoogleGenAI, pageTopic: string, audience: string): Promise<FaqItem[]> => {
    const schema = {type: Type.ARRAY, items: {type: Type.OBJECT, properties: { question: { type: Type.STRING }, answer: { type: Type.STRING } }, required: ["question", "answer"]}};
    const prompt = `Generate 5 FAQs and answers for a webpage about "${pageTopic}", for audience "${audience}".`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
    return JSON.parse(response.text);
};

const generateFaqPageSchemaLogic = async (ai: GoogleGenAI, faqs: FaqItem[]): Promise<string> => {
    const prompt = `Create a valid JSON-LD script for FAQPage structured data from these FAQs:\n${JSON.stringify(faqs, null, 2)}`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text.replace(/```json/g, '').replace(/```/g, '');
};

const generateVideoScriptLogic = async (ai: GoogleGenAI, topic: string, style: string, talkingPoints: string): Promise<VideoScript> => {
    const schema = {type: Type.OBJECT, properties: {title: { type: Type.STRING }, scenes: {type: Type.ARRAY, items: {type: Type.OBJECT, properties: {sceneNumber: { type: Type.INTEGER }, visual: { type: Type.STRING }, voiceover: { type: Type.STRING }, onScreenText: { type: Type.STRING }}, required: ["sceneNumber", "visual", "voiceover"]}}}, required: ["title", "scenes"]};
    const prompt = `Generate a video script. Topic: ${topic}. Style: ${style}. Points: ${talkingPoints}. Create a title and scenes with visuals, voiceover, and optional on-screen text.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
    return JSON.parse(response.text);
};

const generatePressReleaseLogic = async (ai: GoogleGenAI, announcement: string, keyPoints: string): Promise<PressRelease> => {
    const schema = {type: Type.OBJECT, properties: {headline: { type: Type.STRING }, dateline: { type: Type.STRING }, introduction: { type: Type.STRING }, body: { type: Type.STRING }, boilerplate: { type: Type.STRING }, contactInfo: { type: Type.STRING }}, required: ["headline", "dateline", "introduction", "body", "boilerplate", "contactInfo"]};
    const prompt = `Write a press release for Retreat Arcade. Announcement: ${announcement}. Key points: ${keyPoints}. Include boilerplate and contact info.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
    return JSON.parse(response.text);
};

const generateEmailCampaignLogic = async (ai: GoogleGenAI, goal: string, audience: string, emailCount: number, tone: string): Promise<Email[]> => {
    const schema = {type: Type.ARRAY, items: {type: Type.OBJECT, properties: { subject: { type: Type.STRING }, body: { type: Type.STRING } }, required: ["subject", "body"]}};
    const prompt = `Generate an email campaign of ${emailCount} emails. Goal: ${goal}. Audience: ${audience}. Tone: ${tone}. Provide subject and body for each.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
    return JSON.parse(response.text);
};

const generateAnalyticsReportLogic = async (ai: GoogleGenAI, timePeriod: string, metricsData: string): Promise<AnalyticsReport> => {
    const schema = {type: Type.OBJECT, properties: {reportTitle: { type: Type.STRING }, executiveSummary: { type: Type.STRING }, keyWins: { type: Type.ARRAY, items: { type: Type.STRING } }, areasForImprovement: { type: Type.ARRAY, items: { type: Type.STRING } }, actionableRecommendations: { type: Type.ARRAY, items: { type: Type.STRING } }}, required: ["reportTitle", "executiveSummary", "keyWins", "areasForImprovement", "actionableRecommendations"]};
    const prompt = `Analyze website metrics for "${timePeriod}" and generate a report. Data:\n${metricsData}`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
    return JSON.parse(response.text);
};

const generateFullBlogPostLogic = async (ai: GoogleGenAI, topic: string, keywords: string, tone: string): Promise<Omit<BlogPost, 'id' | 'publish_date' | 'status' | 'created_at'>> => {
    const schema = {type: Type.OBJECT, properties: {title: { type: Type.STRING }, content: { type: Type.STRING, description: "Full blog post in Markdown." }, seo: {type: Type.OBJECT, properties: {metaTitle: { type: Type.STRING }, metaDescription: { type: Type.STRING }, slug: { type: Type.STRING }}, required: ["metaTitle", "metaDescription", "slug"]}}, required: ["title", "content", "seo"]};
    const prompt = `Generate a full blog post about "${topic}", with keywords "${keywords}". Tone: ${tone}. Output JSON with title, markdown content, and SEO metadata.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
    return JSON.parse(response.text);
};

const analyzeAndRespondToLeadLogic = async (ai: GoogleGenAI, leadMessage: string): Promise<LeadAnalysis> => {
    const schema = {type: Type.OBJECT, properties: {summary: { type: Type.STRING }, intent: { type: Type.STRING, enum: ['Booking Inquiry', 'Question', 'Partnership', 'Spam', 'Other'] }, quality: { type: Type.STRING, enum: ['Hot', 'Warm', 'Cold'] }, suggestedReply: { type: Type.STRING }}, required: ["summary", "intent", "quality", "suggestedReply"]};
    const prompt = `Analyze this lead for "Retreat Arcade". Analyze summary, intent, quality, and draft a reply. Lead:\n\n${leadMessage}`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
    return JSON.parse(response.text);
};

const generatePageContentLogic = async (ai: GoogleGenAI, pageTitle: string): Promise<string> => {
    const prompt = `Write body content for a webpage titled "${pageTitle}" for "Retreat Arcade". Use Markdown.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text;
};

const generateRobotsTxtLogic = async (ai: GoogleGenAI): Promise<string> => {
    const prompt = `Generate a standard robots.txt file for a website. It should allow all user-agents to crawl the entire site. It must also specify the sitemap location, which is at the absolute path /api/sitemap.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text;
};

const generateEventThemeIdeaLogic = async (ai: GoogleGenAI, theme: string, serviceNames: string[]): Promise<EventThemeIdea> => {
    const schema = {type: Type.OBJECT, properties: {tagline: { type: Type.STRING }, suggestedPackage: {type: Type.ARRAY, items: {type: Type.OBJECT, properties: { serviceName: { type: Type.STRING }, reason: { type: Type.STRING } }, required: ["serviceName", "reason"]}}, socialMediaCampaign: {type: Type.ARRAY, items: {type: Type.OBJECT, properties: { platform: { type: Type.STRING }, postIdea: { type: Type.STRING } }, required: ["platform", "postIdea"]}}}, required: ["tagline", "suggestedPackage", "socialMediaCampaign"]};
    const prompt = `Generate an event blueprint for theme "${theme}". Create a tagline. Suggest a package of 2-3 services from [${serviceNames.join(', ')}] with reasons. Provide 2 social media campaign ideas.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
    return JSON.parse(response.text);
};

const generateVideoLogic = async (ai: GoogleGenAI, prompt: string, aspectRatio: '16:9' | '9:16'): Promise<Operation<any>> => {
    const operation = await ai.models.generateVideos({ model: 'veo-3.1-fast-generate-preview', prompt, config: { numberOfVideos: 1, resolution: '720p', aspectRatio } });
    return operation;
};

const getVideoOperationLogic = async (ai: GoogleGenAI, operation: Operation<any>): Promise<Operation<any>> => {
    const updatedOperation = await ai.operations.getVideosOperation({ operation });
    return updatedOperation;
};

const generateInternalLinksLogic = async (ai: GoogleGenAI, content: string, potentialLinks: { title: string; url: string }[]): Promise<InternalLinkSuggestion[]> => {
    const schema = {type: Type.ARRAY, items: {type: Type.OBJECT, properties: {anchorText: {type: Type.STRING}, suggestedUrl: {type: Type.STRING}, explanation: {type: Type.STRING}}, required: ["anchorText", "suggestedUrl", "explanation"]}};
    const prompt = `Act as an SEO strategist. Analyze the blog post content below and identify 3-5 natural opportunities to add internal links from the provided list. The anchor text must exist in the content. Content: --- ${content} --- Available links: --- ${potentialLinks.map(l => `- Title: "${l.title}", URL: "${l.url}"`).join('\n')} --- Return a JSON array of suggestions.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
    return JSON.parse(response.text);
};

const testApiKeyLogic = async (ai: GoogleGenAI): Promise<{ success: boolean; message: string }> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'hello',
        });
        
        if (response.text) {
            return { success: true, message: 'API key is valid and connection is successful.' };
        } else {
            // This case might not be reachable if an error is thrown first, but it's good practice.
            throw new Error("Received an empty response from the API, which might indicate an issue.");
        }
    } catch (error: any) {
        // Re-throw a more user-friendly error to be caught by the main handler
        console.error("API Key Test Failed in logic function:", error);
        throw new Error(`The API key test failed. Please check if your API_KEY is valid, has billing enabled, and is correctly set in your hosting environment variables. Original error: ${error.message}`);
    }
};
