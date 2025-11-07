import React from 'react';
import Sidebar from './Sidebar';
import { useRouter } from 'next/navigation';
import { useToast } from './ToastProvider';
import { createClient } from '@/lib/supabase/client';
import { getPageBySlug } from '@/lib/admin-pages';
import Dashboard from './Dashboard';

// Import all possible admin page components
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


interface AdminPanelProps {
    path: string;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ path }) => {
  const { showToast } = useToast();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.hash = '/';
  };
  
  const renderAdminPage = () => {
      const slug = path.replace('/admin/', '');
      if (path === '/admin' || slug === '') {
          return <Dashboard />;
      }
      
      const pageInfo = getPageBySlug(slug);
      if (!pageInfo) {
          return <div className="p-8">404 - Page Not Found</div>;
      }
      
      const PageComponent = componentMap[pageInfo.slug];
      if (!PageComponent) {
           return <div className="p-8 text-white">Component for {pageInfo.name} not found.</div>;
      }

      // Inject the showToast prop into manager components
      if (pageInfo.name.endsWith('Manager')) {
        return <PageComponent showToast={showToast} />;
      }

      return <PageComponent />;
  }

  return (
    <div className="flex min-h-screen bg-brand-dark font-sans">
      <Sidebar onLogout={handleLogout} currentPath={path} />
      <main className="flex-1 overflow-y-auto">
        {renderAdminPage()}
      </main>
    </div>
  );
};

export default AdminPanel;
