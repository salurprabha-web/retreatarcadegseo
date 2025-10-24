import React, { useState } from 'react';
import Sidebar from './Sidebar';
import SeoOptimizer from './SeoOptimizer';
import ServicesManager from './ServicesManager';
import GalleryManager from './GalleryManager';
import TestimonialsManager from './TestimonialsManager';
import SiteSettingsManager from './SiteSettingsManager';
import Dashboard from './Dashboard';
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
import ApiKeyValidator from './ApiKeyValidator';

interface AdminPanelProps {
    onLogout: () => void;
    showToast: (message: string, type: 'success' | 'error') => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout, showToast }) => {
  const [activePage, setActivePage] = useState<string>('Dashboard');

  const renderContent = () => {
    const managerProps = { showToast };
    switch (activePage) {
      case 'Dashboard':
        return <Dashboard setActivePage={setActivePage} />;
      case 'SEO Optimizer':
        return <SeoOptimizer />;
      case 'Keyword Research':
        return <KeywordResearcher />;
      case 'Competitor Analysis':
        return <CompetitorAnalyzer />;
      case 'Local SEO':
        return <LocalSeoManager />;
      case 'Analytics Report':
        return <AnalyticsReportGenerator />;
      case 'A/B Testing Ideas':
        return <AbTestGenerator />;
      case 'Indexing Tools':
        return <IndexingTools />;
      case 'Event Theme Ideator':
        return <EventThemeIdeator />;
      case 'Internal Linker':
        return <InternalLinker />;
      case 'Hero Section':
        return <HeroManager {...managerProps} />;
      case 'Services':
        return <ServicesManager {...managerProps} />;
      case 'Gallery':
        return <GalleryManager {...managerProps} />;
      case 'Testimonials':
        return <TestimonialsManager {...managerProps} />;
      case 'Site Settings':
        return <SiteSettingsManager {...managerProps} />;
      case 'API Key Status':
        return <ApiKeyValidator />;
      case 'Pages':
        return <PageManager {...managerProps} />;
      case 'Brand Kit':
        return <BrandKitManager />;
      case 'Content Creator':
        return <ContentCreator />;
      case 'Blog Manager':
        return <BlogManager {...managerProps} />;
      case 'Social Media Post':
        return <SocialMediaPostGenerator />;
      case 'Ad Copy Generator':
        return <AdCopyGenerator />;
       case 'FAQ Generator':
        return <FaqGenerator />;
      case 'Video Script Generator':
        return <VideoScriptGenerator />;
      case 'Video Generator':
        return <VideoGenerator />;
      case 'Press Release Generator':
        return <PressReleaseGenerator />;
      case 'Email Campaign Generator':
        return <EmailCampaignGenerator />;
      case 'Marketing Personas':
        return <MarketingPersonas />;
      case 'Lead Manager':
        return <LeadManager {...managerProps} />;
      default:
        return <Dashboard setActivePage={setActivePage} />;
    }
  };


  return (
    <div className="flex min-h-screen bg-brand-dark font-sans">
      <Sidebar activePage={activePage} setActivePage={setActivePage} onLogout={onLogout} />
      <main className="flex-1 overflow-y-auto">
        {renderContent()}
      </main>
    </div>
  );
};

export default AdminPanel;
