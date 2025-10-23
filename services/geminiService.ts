import { GoogleGenAI, Type, Modality, Operation } from "@google/genai";
import { SeoSuggestions, SiteSettings, KeywordIdeas, CompetitorAnalysis, SocialMediaPost, BrandKit, MarketingPersona, LocalSeoCopy, AdCopy, AbTestIdea, FaqItem, VideoScript, PressRelease, Email, AnalyticsReport, BlogPost, LeadAnalysis, Service, ContentPage, EventThemeIdea, InternalLinkSuggestion } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        title: {
            type: Type.STRING,
            description: "A concise, SEO-optimized meta title, under 60 characters."
        },
        description: {
            type: Type.STRING,
            description: "A compelling meta description, under 160 characters, including a call-to-action."
        },
        keywords: {
            type: Type.ARRAY,
            items: {
                type: Type.STRING
            },
            description: "A list of 5-10 relevant primary and long-tail keywords."
        }
    },
    required: ["title", "description", "keywords"]
};

export const getSeoSuggestions = async (pageContent: string, focusKeywords: string): Promise<SeoSuggestions> => {
    const prompt = `
        Act as a world-class SEO expert and digital marketing strategist.
        Your client, "Retreat Arcade", has a premium, luxury event rental business specializing in high-end, modern arcade games and interactive experiences for corporate events, weddings, and exclusive parties.
        The brand voice is sophisticated, exclusive, and exciting.

        Analyze the following page content and focus keywords.
        Generate a JSON object with SEO-optimized metadata.

        Page Content:
        ---
        ${pageContent}
        ---

        Focus Keywords:
        ---
        ${focusKeywords}
        ---

        Based on the provided information, create a meta title, meta description, and a list of keywords.
        - The title should be engaging, under 60 characters, and include the primary keyword.
        - The description should be compelling, under 160 characters, entice users to click, and include main keywords naturally.
        - The keywords list should include a mix of the provided focus keywords and related long-tail keywords that a potential customer might search for.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.7,
            }
        });

        const jsonText = response.text.trim();
        const suggestions: SeoSuggestions = JSON.parse(jsonText);
        return suggestions;

    } catch (error) {
        console.error("Error generating SEO suggestions:", error);
        throw new Error("Failed to get suggestions from Gemini API. Please check the console for details.");
    }
};

export const generateImage = async (prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: prompt }],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                const imageUrl = `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
                return imageUrl;
            }
        }
        throw new Error("No image data found in the response.");

    } catch (error) {
        console.error("Error generating image:", error);
        throw new Error("Failed to generate image with Gemini API.");
    }
};

export const editImage = async (imageDataBase64: string, prompt: string): Promise<string> => {
    if (!imageDataBase64) {
        throw new Error("No image data provided to edit.");
    }
    if (!prompt) {
        throw new Error("An editing prompt is required.");
    }

    const mimeTypeMatch = imageDataBase64.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);
    if (!mimeTypeMatch || mimeTypeMatch.length < 2) {
        throw new Error("Invalid image data format.");
    }
    const mimeType = mimeTypeMatch[1];
    const base64Data = imageDataBase64.split(',')[1];

    const imagePart = {
        inlineData: {
            mimeType,
            data: base64Data,
        },
    };

    const textPart = { text: prompt };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                const imageUrl = `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
                return imageUrl;
            }
        }
        throw new Error("No edited image data found in the response.");

    } catch (error) {
        console.error("Error editing image:", error);
        throw new Error("Failed to edit image with Gemini API.");
    }
};


export const getAltTextSuggestion = async (imageDataBase64: string): Promise<string> => {
    if (!imageDataBase64) {
        throw new Error("No image data provided to generate alt text.");
    }
    const mimeTypeMatch = imageDataBase64.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);
    if (!mimeTypeMatch || mimeTypeMatch.length < 2) {
        throw new Error("Invalid image data format.");
    }
    const mimeType = mimeTypeMatch[1];
    const base64Data = imageDataBase64.split(',')[1];

    const imagePart = {
        inlineData: {
            mimeType,
            data: base64Data,
        },
    };

    const textPart = {
        text: `
            Analyze this image from "Retreat Arcade", a luxury event rental company.
            Generate a concise, descriptive, and SEO-friendly alt text.
            The alt text should:
            1.  Be under 125 characters.
            2.  Accurately describe the image contents (people, objects, scene).
            3.  Incorporate relevant keywords like "luxury event", "arcade game rental", "corporate party", "wedding entertainment" IF appropriate to the image.
            4.  Fit the sophisticated and exciting brand voice.
            Do not include "Image of" or "Picture of".
            Return only the alt text string, with no extra formatting or quotation marks.
        `,
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
        });

        return response.text.trim().replace(/"/g, ''); // Clean up potential quotes
    } catch (error) {
        console.error("Error generating alt text:", error);
        throw new Error("Failed to generate alt text suggestion.");
    }
};

const serviceSeoSchema = {
    type: Type.OBJECT,
    properties: {
        metaTitle: {
            type: Type.STRING,
            description: "A concise, SEO-optimized meta title, under 60 characters, featuring the service name."
        },
        metaDescription: {
            type: Type.STRING,
            description: "A compelling meta description, under 160 characters, including a call-to-action."
        },
        slug: {
            type: Type.STRING,
            description: "A URL-friendly slug, using lowercase letters and hyphens."
        }
    },
    required: ["metaTitle", "metaDescription", "slug"]
};

export const getServiceSeoSuggestions = async (serviceName: string, serviceDescription: string): Promise<Service['seo']> => {
    const prompt = `
        Generate SEO metadata for a luxury event rental service.
        Service Name: ${serviceName}
        Description: ${serviceDescription}
        Create a meta title, meta description, and a URL slug. The slug should be lowercase with words separated by hyphens.
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: serviceSeoSchema }
    });
    return JSON.parse(response.text);
};

const serviceDetailsSchema = {
    type: Type.OBJECT,
    properties: {
        long_description: { type: Type.STRING },
        features: { type: Type.ARRAY, items: { type: Type.STRING } },
        specifications: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    key: { type: Type.STRING },
                    value: { type: Type.STRING }
                },
                required: ["key", "value"]
            }
        }
    },
    required: ["long_description", "features", "specifications"]
};

export const generateServiceDetails = async (serviceName: string, serviceDescription: string): Promise<Pick<Service, 'long_description' | 'features' | 'specifications'>> => {
    const prompt = `
        Generate detailed content for a luxury event rental service.
        Service Name: ${serviceName}
        Description: ${serviceDescription}
        Create a long description, a list of 5 key features, and a list of 4 technical specifications (like dimensions, power, etc.).
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: serviceDetailsSchema }
    });
    return JSON.parse(response.text);
};

export const generateProductSchema = async (service: Service): Promise<string> => {
    const prompt = `
        Generate a JSON-LD script for a "Product" schema based on the following service details.
        The schema should include name, description, brand, an offers object with price and currency, and an image.
        
        Service Name: ${service.name}
        Description: ${service.long_description}
        Brand Name: Retreat Arcade
        Price: ${service.price}
        Image URL: ${service.image_url}
    `;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt });
    return response.text;
};

export const getHighlightedQuote = async (testimonialText: string): Promise<string> => {
    const prompt = `Analyze the following testimonial and extract the most impactful, concise quote (under 150 characters) suitable for marketing. Return only the quote as a string.\n\nTestimonial: "${testimonialText}"`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text.trim().replace(/"/g, '');
};

export const generateBusinessSchema = async (settings: SiteSettings): Promise<string> => {
    const prompt = `Generate a JSON-LD script for a "LocalBusiness" schema using these details:\n\n${JSON.stringify(settings, null, 2)}`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt });
    return response.text;
};

export const generateBlogPost = async (topic: string, tone: string): Promise<string> => {
    const prompt = `Write a 500-word blog post for "Retreat Arcade", a luxury event rental company. The tone should be ${tone}. The topic is: "${topic}". Format the output in Markdown with headings.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt });
    return response.text;
};

export const generateKeywordIdeas = async (topic: string): Promise<KeywordIdeas> => {
    const schema = {
        type: Type.OBJECT,
        properties: {
            longTailKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            questionKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            relatedTopics: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["longTailKeywords", "questionKeywords", "relatedTopics"]
    };
    const prompt = `Generate keyword ideas for the topic: "${topic}". Provide a list of long-tail keywords, question-based keywords, and related content topics.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
    return JSON.parse(response.text);
};

export const analyzeCompetitor = async (url: string, description: string): Promise<CompetitorAnalysis> => {
    const schema = {
        type: Type.OBJECT,
        properties: {
            seoStrengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            contentStrategy: { type: Type.ARRAY, items: { type: Type.STRING } },
            toneOfVoice: { type: Type.STRING },
            opportunities: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["seoStrengths", "contentStrategy", "toneOfVoice", "opportunities"]
    };
    const prompt = `Analyze a competitor for Retreat Arcade. Competitor URL: ${url}. Description: ${description}. Analyze their SEO strengths, content strategy, brand tone, and identify opportunities for Retreat Arcade.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
    return JSON.parse(response.text);
};

export const generateSocialMediaPosts = async (topic: string, platform: string, cta: string): Promise<SocialMediaPost[]> => {
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                copy: { type: Type.STRING },
                hashtags: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["copy", "hashtags"]
        }
    };
    const prompt = `Generate 3 distinct social media post variations for ${platform}. The topic is "${topic}". The brand is "Retreat Arcade". If provided, include this call to action: "${cta}". Each post should have engaging copy and relevant hashtags.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
    return JSON.parse(response.text);
};

export const generateBrandKit = async (description: string): Promise<BrandKit> => {
    const schema = {
        type: Type.OBJECT,
        properties: {
            missionStatement: { type: Type.STRING },
            coreValues: { type: Type.ARRAY, items: { type: Type.STRING } },
            brandVoice: { type: Type.STRING },
            taglines: { type: Type.ARRAY, items: { type: Type.STRING } },
            colorPalette: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        hex: { type: Type.STRING },
                        description: { type: Type.STRING }
                    },
                    required: ["name", "hex", "description"]
                }
            }
        },
        required: ["missionStatement", "coreValues", "brandVoice", "taglines", "colorPalette"]
    };
    const prompt = `Generate a complete brand kit for a business with this description: "${description}". Include a mission statement, 3 core values, a description of the brand voice, 4 tagline options, and a 5-color palette with names, hex codes, and descriptions.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
    return JSON.parse(response.text);
};

export const generateMarketingPersona = async (businessDescription: string, targetAudience: string): Promise<MarketingPersona> => {
    const schema = {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING },
            photoDescription: { type: Type.STRING },
            demographics: {
                type: Type.OBJECT,
                properties: { age: { type: Type.STRING }, jobTitle: { type: Type.STRING }, location: { type: Type.STRING } },
                required: ["age", "jobTitle", "location"]
            },
            goals: { type: Type.ARRAY, items: { type: Type.STRING } },
            painPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            wateringHoles: { type: Type.ARRAY, items: { type: Type.STRING } },
            marketingMessage: { type: Type.STRING }
        },
        required: ["name", "photoDescription", "demographics", "goals", "painPoints", "wateringHoles", "marketingMessage"]
    };
    const prompt = `Create a detailed marketing persona for this business: "${businessDescription}". The target audience is: "${targetAudience}". Include a name, a detailed description for an AI image generator, demographics, goals, pain points, watering holes (where they hang out online/offline), and a tailored marketing message.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
    return JSON.parse(response.text);
};

export const generateLocalSeoCopy = async (targetLocation: string, services: string): Promise<LocalSeoCopy> => {
    const schema = {
        type: Type.OBJECT,
        properties: {
            gbpDescription: { type: Type.STRING },
            gbpPosts: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: { title: { type: Type.STRING }, content: { type: Type.STRING } },
                    required: ["title", "content"]
                }
            },
            landingPageIntro: { type: Type.STRING },
            localKeywords: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["gbpDescription", "gbpPosts", "landingPageIntro", "localKeywords"]
    };
    const prompt = `Generate local SEO content for Retreat Arcade targeting "${targetLocation}". Our services are: ${services}. Create a Google Business Profile description, 2 example GBP posts, a local landing page intro, and a list of local keywords.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
    return JSON.parse(response.text);
};

export const generateAdCopy = async (product: string, talkingPoints: string, platform: string, audience: string): Promise<AdCopy> => {
    const prompt = `
        Generate ad copy for "Retreat Arcade".
        Platform: ${platform}
        Product: ${product}
        Target Audience: ${audience}
        Key Talking Points: ${talkingPoints}

        If Google Ads, provide 3 headlines (under 30 chars) and 2 descriptions (under 90 chars).
        If Facebook/Instagram Ads, provide 2 primary texts, 3 headlines, and 3 CTA suggestions.
        Return a single JSON object with either a 'googleAds' or 'facebookAds' key.
    `;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    // A more robust solution would be to use a schema, but for simplicity we parse the text
    const text = response.text.replace(/```json/g, '').replace(/```/g, '');
    return JSON.parse(text);
};

export const generateAbTestIdeas = async (pageDescription: string, pageGoal: string, elementToTest: string): Promise<AbTestIdea[]> => {
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                hypothesis: { type: Type.STRING },
                variantA: { type: Type.STRING },
                variantB: { type: Type.STRING },
                primaryMetric: { type: Type.STRING }
            },
            required: ["hypothesis", "variantA", "variantB", "primaryMetric"]
        }
    };
    const prompt = `Generate 3 A/B test ideas. The page is: ${pageDescription}. The goal is: ${pageGoal}. The element to test is: ${elementToTest}.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
    return JSON.parse(response.text);
};

export const generateFaqs = async (pageTopic: string, audience: string): Promise<FaqItem[]> => {
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: { question: { type: Type.STRING }, answer: { type: Type.STRING } },
            required: ["question", "answer"]
        }
    };
    const prompt = `Generate a list of 5 frequently asked questions and their answers for a webpage about "${pageTopic}", targeted at "${audience}".`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
    return JSON.parse(response.text);
};

export const generateFaqPageSchema = async (faqs: FaqItem[]): Promise<string> => {
    const prompt = `
        Create a valid JSON-LD script for FAQPage structured data based on the following question and answer pairs.
        The output should be a single JSON object that can be placed in a <script type="application/ld+json"> tag.

        FAQs:
        ${JSON.stringify(faqs, null, 2)}
    `;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt });
    return response.text.replace(/```json/g, '').replace(/```/g, '');
};

export const generateVideoScript = async (topic: string, style: string, talkingPoints: string): Promise<VideoScript> => {
    const schema = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            scenes: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        sceneNumber: { type: Type.INTEGER },
                        visual: { type: Type.STRING },
                        voiceover: { type: Type.STRING },
                        onScreenText: { type: Type.STRING }
                    },
                    required: ["sceneNumber", "visual", "voiceover"]
                }
            }
        },
        required: ["title", "scenes"]
    };
    const prompt = `Generate a video script. Topic: ${topic}. Style: ${style}. Key points: ${talkingPoints}. Create a title and a sequence of scenes with visual descriptions, voiceover text, and optional on-screen text.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
    return JSON.parse(response.text);
};

export const generatePressRelease = async (announcement: string, keyPoints: string): Promise<PressRelease> => {
    const schema = {
        type: Type.OBJECT,
        properties: {
            headline: { type: Type.STRING },
            dateline: { type: Type.STRING },
            introduction: { type: Type.STRING },
            body: { type: Type.STRING },
            boilerplate: { type: Type.STRING },
            contactInfo: { type: Type.STRING }
        },
        required: ["headline", "dateline", "introduction", "body", "boilerplate", "contactInfo"]
    };
    const prompt = `Write a professional press release for Retreat Arcade. The announcement is: ${announcement}. Key points to include are: ${keyPoints}. Include a standard boilerplate and placeholder contact info.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
    return JSON.parse(response.text);
};

export const generateEmailCampaign = async (goal: string, audience: string, emailCount: number, tone: string): Promise<Email[]> => {
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: { subject: { type: Type.STRING }, body: { type: Type.STRING } },
            required: ["subject", "body"]
        }
    };
    const prompt = `Generate an email campaign of ${emailCount} emails. The goal is: ${goal}. The audience is: ${audience}. The tone should be ${tone}. Provide a subject and body for each email.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
    return JSON.parse(response.text);
};

export const generateAnalyticsReport = async (timePeriod: string, metricsData: string): Promise<AnalyticsReport> => {
    const schema = {
        type: Type.OBJECT,
        properties: {
            reportTitle: { type: Type.STRING },
            executiveSummary: { type: Type.STRING },
            keyWins: { type: Type.ARRAY, items: { type: Type.STRING } },
            areasForImprovement: { type: Type.ARRAY, items: { type: Type.STRING } },
            actionableRecommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["reportTitle", "executiveSummary", "keyWins", "areasForImprovement", "actionableRecommendations"]
    };
    const prompt = `Analyze the following website metrics for the period "${timePeriod}" and generate a concise report. Data:\n${metricsData}`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
    return JSON.parse(response.text);
};

export const generateFullBlogPost = async (topic: string, keywords: string, tone: string): Promise<Omit<BlogPost, 'id' | 'publish_date' | 'status' | 'created_at'>> => {
    const schema = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            content: { type: Type.STRING, description: "The full blog post content in Markdown format." },
            seo: {
                type: Type.OBJECT,
                properties: {
                    metaTitle: { type: Type.STRING },
                    metaDescription: { type: Type.STRING },
                    slug: { type: Type.STRING }
                },
                required: ["metaTitle", "metaDescription", "slug"]
            }
        },
        required: ["title", "content", "seo"]
    };
    const prompt = `Generate a full blog post about "${topic}", including the keywords "${keywords}". The tone should be ${tone}. The output must be a JSON object containing the post title, the full content in Markdown, and SEO metadata (meta title, meta description, slug).`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
    return JSON.parse(response.text);
};

export const analyzeAndRespondToLead = async (leadMessage: string): Promise<LeadAnalysis> => {
    const schema = {
        type: Type.OBJECT,
        properties: {
            summary: { type: Type.STRING },
            intent: { type: Type.STRING, enum: ['Booking Inquiry', 'Question', 'Partnership', 'Spam', 'Other'] },
            quality: { type: Type.STRING, enum: ['Hot', 'Warm', 'Cold'] },
            suggestedReply: { type: Type.STRING }
        },
        required: ["summary", "intent", "quality", "suggestedReply"]
    };
    const prompt = `Analyze this incoming lead for "Retreat Arcade" and generate a response. Analyze the summary, intent, and quality. Then, draft a professional and helpful reply. Lead:\n\n${leadMessage}`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
    return JSON.parse(response.text);
};

export const generatePageContent = async (pageTitle: string): Promise<string> => {
    const prompt = `Write the body content for a webpage titled "${pageTitle}" for the company "Retreat Arcade". Use Markdown for formatting.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt });
    return response.text;
};

export const generateRobotsTxt = async (): Promise<string> => {
    const prompt = `Generate a standard robots.txt file for a website. It should allow all user-agents to crawl the entire site and specify the location of the sitemap.xml file.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text;
};

export const generateSitemapXml = async (urls: string[]): Promise<string> => {
    const prompt = `Generate a sitemap.xml file for a website with the following URLs:\n${urls.join('\n')}. Use standard sitemap protocol. Include lastmod, changefreq, and priority tags with sensible defaults.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt });
    return response.text;
};

export const generateEventThemeIdea = async (theme: string, serviceNames: string[]): Promise<EventThemeIdea> => {
    const schema = {
        type: Type.OBJECT,
        properties: {
            tagline: { type: Type.STRING },
            suggestedPackage: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: { serviceName: { type: Type.STRING }, reason: { type: Type.STRING } },
                    required: ["serviceName", "reason"]
                }
            },
            socialMediaCampaign: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: { platform: { type: Type.STRING }, postIdea: { type: Type.STRING } },
                    required: ["platform", "postIdea"]
                }
            }
        },
        required: ["tagline", "suggestedPackage", "socialMediaCampaign"]
    };
    const prompt = `Generate an event blueprint for the theme "${theme}". Create a catchy tagline. Suggest a package of 2-3 services from this list: [${serviceNames.join(', ')}] and explain why they fit. Finally, provide 2 social media campaign ideas.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
    return JSON.parse(response.text);
};

export const generateVideo = async (prompt: string, aspectRatio: '16:9' | '9:16'): Promise<Operation> => {
    try {
        const videoAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const operation = await videoAI.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: aspectRatio,
            }
        });
        return operation;
    } catch (error: any) {
        if (error.message.includes("API key not found") || error.message.includes("Requested entity was not found")) {
            throw new Error("API key not found. Please select a valid API key to generate videos.");
        }
        console.error("Error generating video:", error);
        throw new Error("Failed to start video generation with Gemini API.");
    }
};

export const getVideoOperation = async (operation: Operation): Promise<Operation> => {
    try {
        const videoAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const updatedOperation = await videoAI.operations.getVideosOperation({ operation });
        return updatedOperation;
    } catch (error: any) {
        if (error.message.includes("API key not found") || error.message.includes("Requested entity was not found")) {
             throw new Error("API key not found. Please select a valid API key to generate videos.");
        }
        console.error("Error polling video operation:", error);
        throw new Error("Failed to get video generation status.");
    }
};

export const generateInternalLinks = async (content: string, potentialLinks: { title: string; url: string }[]): Promise<InternalLinkSuggestion[]> => {
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                anchorText: {
                    type: Type.STRING,
                    description: "The exact phrase from the blog post content to be used as the anchor text for the link."
                },
                suggestedUrl: {
                    type: Type.STRING,
                    description: "The most relevant URL from the provided list to link to."
                },
                explanation: {
                    type: Type.STRING,
                    description: "A brief explanation of why this link is relevant and beneficial for SEO."
                }
            },
            required: ["anchorText", "suggestedUrl", "explanation"]
        }
    };
    const prompt = `
        Act as a world-class SEO strategist specializing in on-page optimization and internal linking for a luxury brand.
        Your client is "Retreat Arcade".

        Analyze the following blog post content. Your goal is to identify opportunities to add valuable, contextually relevant internal links to other pages on the site.

        Here is the list of available pages to link to:
        ---
        ${potentialLinks.map(link => `- Title: "${link.title}", URL: "${link.url}"`).join('\n')}
        ---

        Here is the blog post content to analyze:
        ---
        ${content}
        ---

        Instructions:
        1. Read through the blog content and identify key phrases, service mentions, or concepts that directly relate to one of the available pages.
        2. The 'anchorText' must be an exact phrase that exists within the blog post content.
        3. The 'suggestedUrl' must be one of the URLs from the provided list.
        4. Provide a concise 'explanation' for each suggestion, detailing why it's a good link (e.g., "Links to the specific service page being mentioned," or "Provides more detail on a related topic.").
        5. Aim for 3-5 high-quality, relevant link suggestions. Do not force links where they don't fit naturally.

        Return your analysis as a JSON array of objects following the defined schema.
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: schema }
    });
    return JSON.parse(response.text);
};