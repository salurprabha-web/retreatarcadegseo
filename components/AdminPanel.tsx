import React from 'react';
import Sidebar from './Sidebar';
import { useToast } from './ToastProvider';
import { createClient } from '../lib/supabase/client';
import { getPageBySlug } from '../lib/admin-pages';
import Dashboard from './Dashboard';

// Import all possible admin page components
import SeoOptimizer from './SeoOptimizer';
import ServicesManager from './ServicesManager';
import GalleryManager from './GalleryManager';
import TestimonialsManager from './TestimonialsManager';
import SiteSettingsManager from './SiteSettingsManager';
import ContentCreator from './ContentCreator';
import KeywordResearcher from './KeywordResearcher';
import CompetitorAnalyzer from './CompetitorAnalyzer';
import SocialMediaPostGenerator from './SocialMediaPostGenerator';
import BrandKitManager from './BrandKitManager';
import MarketingPersonas from './MarketingPersonas';
import LocalSeoManager from './LocalSeoManager';
import AdCopyGenerator from './AdCopyGenerator';
import AbTestGenerator from './AbTestGenerator';
import FaqGenerator from './FaqGenerator';
import VideoScriptGenerator from './VideoScriptGenerator';
import PressReleaseGenerator from './PressReleaseGenerator';
import EmailCampaignGenerator from './EmailCampaignGenerator';
import AnalyticsReportGenerator from './AnalyticsReportGenerator';
import BlogManager from './BlogManager';
import LeadManager from './LeadManager';
import HeroManager from './HeroManager';
import PageManager from './PageManager';
import IndexingTools from './IndexingTools';
import EventThemeIdeator from './EventThemeIdeator';
import VideoGenerator from './VideoGenerator';
import InternalLinker from './InternalLinker';
import ApiKeyTester from './ApiKeyTester';


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