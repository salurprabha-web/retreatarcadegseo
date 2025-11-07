'use client';
import React from 'react';
import { NAV_ITEMS, LogoutIcon } from '../constants';

interface SidebarProps {
  onLogout: () => void;
  // FIX: Add activePage and setActivePage to props for state-based navigation
  activePage: string;
  setActivePage: (page: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout, activePage, setActivePage }) => {
  const navGroups = {
    "Overview": ["Dashboard"],
    "Strategy": ["SEO Optimizer", "Keyword Research", "Competitor Analysis", "Local SEO", "Analytics Report", "Marketing Personas", "A/B Testing Ideas", "Indexing Tools", "Event Theme Ideator", "Internal Linker"],
    "Content": ["Content Creator", "Blog Manager", "Social Media Post", "Ad Copy Generator", "FAQ Generator", "Video Script Generator", "Video Generator", "Press Release Generator", "Email Campaign Generator", "Brand Kit"],
    "Management": ["Hero Section", "Services", "Gallery", "Testimonials", "Lead Manager", "Pages", "Site Settings"],
    "Utilities": ["API Key Tester"],
  };
  
  const groupedNavItems = Object.entries(navGroups).map(([groupName, itemNames]) => ({
    groupName,
    items: NAV_ITEMS.filter(item => itemNames.includes(item.name))
  }));

  return (
    <aside className="w-64 bg-brand-secondary text-brand-light flex flex-col">
      <div className="flex items-center justify-center h-20 border-b border-gray-700">
        <h1 className="text-2xl font-bold text-brand-accent font-poppins">Retreat</h1>
        <h1 className="text-2xl font-bold text-white font-poppins ml-1">Arcade</h1>
      </div>
      <nav className="flex-1 px-4 py-6 overflow-y-auto">
        {groupedNavItems.map(({ groupName, items }) => (
          <div key={groupName} className="mb-6">
            <h2 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{groupName}</h2>
            <ul>
              {items.map((item) => {
                  // FIX: Use activePage prop for determining active state
                  const isActive = activePage === item.name;

                  return (
                    <li key={item.name} className="mb-1">
                      {/* FIX: Replace Next.js Link with a button that uses setActivePage */}
                      <button
                        onClick={() => setActivePage(item.name)}
                        className={`flex items-center p-3 rounded-lg transition-colors duration-200 w-full text-left ${
                          isActive
                            ? 'bg-brand-accent text-brand-dark font-semibold'
                            : 'hover:bg-gray-700'
                        }`}
                      >
                        <span className="mr-3">{item.icon}</span>
                        {item.name}
                      </button>
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-700">
          <button
            onClick={onLogout}
            className="flex items-center p-3 rounded-lg transition-colors duration-200 hover:bg-red-800/50 w-full text-red-300"
          >
            <span className="mr-3"><LogoutIcon /></span>
            Logout
          </button>
      </div>
    </aside>
  );
};

export default Sidebar;
