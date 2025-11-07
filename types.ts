export interface SeoData {
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  slug: string;
  canonicalUrl: string;
}

export interface SeoSuggestions {
  title: string;
  description: string;
  keywords: string[];
}

export interface Service {
  id: string; // uuid
  name: string;
  description: string; // Short description for cards
  long_description: string; // Detailed description for the service page
  category: string;
  price: number;
  image_url: string; // Primary image
  gallery_image_urls: string[]; // Additional images for the gallery
  features: string[]; // Key features list
  specifications: { key: string; value: string }[]; // Technical specs
  related_service_ids: string[]; // For "Similar Services" section
  seo: {
    metaTitle: string;
    metaDescription: string;
    slug: string;
  };
  created_at: string;
}


export interface GalleryImage {
  id: string; // uuid
  title: string;
  alt_text: string;
  image_url: string;
  storage_path: string; // To find the image in Supabase storage
  created_at: string;
}

export interface Testimonial {
  id: string; // uuid
  client_name: string;
  event_type: string;
  date: string;
  rating: number; // 1-5
  testimonial_text: string;
  highlighted_quote?: string;
  created_at: string;
}

export interface HeroSlide {
  id: string; // uuid
  type: 'image' | 'video';
  background_url: string; // URL to image or video
  alt_text: string; // For SEO, primarily for images
  duration: number; // in seconds, for image slides
  headline: string;
  subheadline: string;
  cta_text: string;
  cta_link: string;
  created_at: string;
}

export interface SiteSettings {
  id: number; // always 1
  business_name: string;
  contact_email: string;
  phone_number: string;
  whatsapp_number: string;
  address: string;
  socials: {
    facebook: string;
    instagram: string;
    twitter: string;
    linkedin: string;
  };
  updated_at: string;
}

export interface KeywordIdeas {
  longTailKeywords: string[];
  questionKeywords: string[];
  relatedTopics: string[];
}

export interface CompetitorAnalysis {
  seoStrengths: string[];
  contentStrategy: string[];
  toneOfVoice: string;
  opportunities: string[];
}

export interface SocialMediaPost {
    copy: string;
    hashtags: string[];
}

export interface ColorPaletteItem {
  name: string;
  hex: string;
  description: string;
}

export interface BrandKit {
  missionStatement: string;
  coreValues: string[];
  brandVoice: string;
  taglines: string[];
  colorPalette: ColorPaletteItem[];
}

export interface MarketingPersona {
  name: string;
  photoDescription: string;
  demographics: {
    age: string;
    jobTitle: string;
    location: string;
  };
  goals: string[];
  painPoints: string[];
  wateringHoles: string[];
  marketingMessage: string;
}

export interface LocalSeoCopy {
  gbpDescription: string;
  gbpPosts: {
    title: string;
    content: string;
  }[];
  landingPageIntro: string;
  localKeywords: string[];
}

export interface GoogleAdCopy {
  headlines: string[];
  descriptions: string[];
}

export interface FacebookAdCopy {
  primaryTexts: string[];
  headlines: string[];
  ctaSuggestions: string[];
}

export interface AdCopy {
    googleAds?: GoogleAdCopy;
    facebookAds?: FacebookAdCopy;
}

export interface AbTestIdea {
  hypothesis: string;
  variantA: string;
  variantB: string;
  primaryMetric: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface VideoScene {
  sceneNumber: number;
  visual: string;
  voiceover: string;
  onScreenText?: string;
}

export interface VideoScript {
  title: string;
  scenes: VideoScene[];
}

export interface PressRelease {
  headline: string;
  dateline: string;
  introduction: string;
  body: string;
  boilerplate: string;
  contactInfo: string;
}

export interface Email {
  subject: string;
  body: string;
}

export interface AnalyticsReport {
  reportTitle: string;
  executiveSummary: string;
  keyWins: string[];
  areasForImprovement: string[];
  actionableRecommendations: string[];
}

export interface BlogPost {
  id: string; // uuid
  title: string;
  content: string; // Markdown
  publish_date: string;
  status: 'Draft' | 'Published';
  seo: {
    metaTitle: string;
    metaDescription: string;
    slug: string;
  };
  created_at: string;
}

export interface LeadAnalysis {
  summary: string;
  intent: 'Booking Inquiry' | 'Question' | 'Partnership' | 'Spam' | 'Other';
  quality: 'Hot' | 'Warm' | 'Cold';
  suggestedReply: string;
}

export interface Lead {
  id: string; // uuid
  sender_name: string;
  sender_email: string;
  subject: string;
  message: string;
  received_date: string;
  ai_analysis?: LeadAnalysis;
  status: 'New' | 'Contacted' | 'Qualified' | 'Unqualified' | 'Closed';
  created_at: string;
}

export interface ContentPage {
  id: 'about' | 'privacy' | 'terms';
  title: string;
  content: string; // Markdown
  seo: {
    metaTitle: string;
    metaDescription: string;
    slug: string; // e.g., 'about', 'privacy'
  };
  updated_at: string;
}

export interface EventThemeIdea {
  tagline: string;
  suggestedPackage: {
    serviceName: string;
    reason: string;
  }[];
  socialMediaCampaign: {
    platform: string;
    postIdea: string;
  }[];
}

export interface InternalLinkSuggestion {
  anchorText: string;
  suggestedUrl: string;
  explanation: string;
}