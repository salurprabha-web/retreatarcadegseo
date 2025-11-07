'use client';
// Fix: Add React import
import React from 'react';
import { notFound } from 'next/navigation';
import SeoOptimizer from '@/components/SeoOptimizer';
import ServicesManager from '@/components/ServicesManager';
import GalleryManager from '@/components/GalleryManager';
import TestimonialsManager from '@/components/TestimonialsManager';
import SiteSettingsManager from '@/components/SiteSettingsManager';
import ContentCreator from '@/components/ContentCreator';
import KeywordResearcher from '@/components/KeywordResearcher';
import CompetitorAnalyzer from '@/components/CompetitorAnalyzer';
import SocialMediaPostGenerator from '@/components/SocialMediaPostGenerator';
import BrandKitManager from '@/components/BrandKitManager';
import MarketingPersonas from '@/components/MarketingPersonas';
import LocalSeoManager from '@/components/LocalSeoManager';
import AdCopyGenerator from '@/components/AdCopyGenerator';
import AbTestGenerator from '@/components/AbTestGenerator';
import FaqGenerator from '@/components/FaqGenerator';
import VideoScriptGenerator from '@/components/VideoScriptGenerator';
import PressReleaseGenerator from '@/components/PressReleaseGenerator';
import EmailCampaignGenerator from '@/components/EmailCampaignGenerator';
import AnalyticsReportGenerator from '@/components/AnalyticsReportGenerator';
import BlogManager from '@/components/BlogManager';
import LeadManager from '@/components/LeadManager';
import HeroManager from '@/components/HeroManager';
import PageManager from '@/components/PageManager';
import IndexingTools from '@/components/IndexingTools';
import EventThemeIdeator from '@/components/EventThemeIdeator';
import VideoGenerator from '@/components/VideoGenerator';
import InternalLinker from '@/components/InternalLinker';
import ApiKeyTester from '@/components/ApiKeyTester';
import { getPageBySlug } from '@/lib/admin-pages';

const componentMap: { [key: string]: React.ComponentType<any> } = {
    'seo-optimizer': SeoOptimizer,
    'keyword-research': KeywordResearcher,
    'competitor-analysis': CompetitorAnalyzer,
    'local-seo': LocalSeoManager,
    'analytics-report': AnalyticsReportGenerator,
    'marketing-personas': MarketingPersonas,
    'a-b-testing-ideas': AbTestGenerator,
    'indexing-tools': IndexingTools,
    'event-theme-ideator': EventThemeIdeator,
    'internal-linker': InternalLinker,
    'content-creator': ContentCreator,
    'blog-manager': BlogManager,
    'social-media-post': SocialMediaPostGenerator,
    'ad-copy-generator': AdCopyGenerator,
    'faq-generator': FaqGenerator,
    'video-script-generator': VideoScriptGenerator,
    'video-generator': VideoGenerator,
    'press-release-generator': PressReleaseGenerator,
    'email-campaign-generator': EmailCampaignGenerator,
    'brand-kit': BrandKitManager,
    'hero-section': HeroManager,
    'services': ServicesManager,
    'gallery': GalleryManager,
    'testimonials': TestimonialsManager,
    'lead-manager': LeadManager,
    'pages': PageManager,
    'site-settings': SiteSettingsManager,
    'api-key-tester': ApiKeyTester,
};

export default function AdminPage({ params }: { params: { page: string } }) {
  const pageInfo = getPageBySlug(params.page);
  
  if (!pageInfo) {
    notFound();
  }

  const PageComponent = componentMap[pageInfo.slug];

  if (!PageComponent) {
    return <div className="p-8 text-white">Component for {pageInfo.name} not found.</div>;
  }

  return <PageComponent />;
}