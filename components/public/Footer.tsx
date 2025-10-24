import React from 'react';
import { SiteSettings } from '../../types';

const FacebookIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v2.385z"/></svg>;
const InstagramIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.85s-.011 3.584-.069 4.85c-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07s-3.584-.012-4.85-.07c-3.252-.148-4.771-1.691-4.919-4.919-.058-1.265-.07-1.645-.07-4.85s.012-3.584.07-4.85c.148-3.225 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.85-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948s.014 3.667.072 4.947c.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072s3.667-.014 4.947-.072c4.358-.2 6.78-2.618 6.98-6.98.059-1.281.073-1.689.073-4.948s-.014-3.667-.072-4.947c-.2-4.358-2.618-6.78-6.98-6.98-1.281-.058-1.689-.072-4.948-.072zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4s1.791-4 4-4 4 1.79 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44 1.441-.645 1.441-1.44-.645-1.44-1.441-1.44z"/></svg>;
const TwitterIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>;
const LinkedInIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.408 2.983-4.408 2.983 0v8.399h4.983v-10.396c0-6.89-3.8-9.604-9.968-9.604z"/></svg>;
const WhatsAppIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99 0-3.903-.52-5.687-1.475L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.433-9.89-9.889-9.89-5.452 0-9.887 4.434-9.889 9.891.001 2.23.652 4.395 1.846 6.233l-.985 3.638 3.732-.986zm-1.57-2.97-.57-.34c-1.423-.85-2.822-2.12-3.86-3.626l-.23-.36.004-.36c.004-3.303 2.699-5.999 6.005-5.999 1.58 0 3.061.624 4.159 1.722l.123.123c1.099 1.098 1.718 2.575 1.719 4.153.002 3.303-2.698 5.999-6.004 5.999-1.334 0-2.62-.423-3.692-1.22l-.24-.179z"/></svg>;


interface FooterProps {
    settings: SiteSettings;
}

const Footer: React.FC<FooterProps> = ({ settings }) => {
  return (
    <footer className="bg-brand-dark border-t border-gray-800">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center md:text-left">
          {/* Brand Info */}
          <div className="md:col-span-1">
            <button onClick={() => window.location.hash = '#/'} className="inline-block mb-4 text-left">
                <h1 className="text-2xl font-bold text-brand-accent font-poppins">Retreat</h1>
                <h1 className="text-2xl font-bold text-white font-poppins ml-1">Arcade</h1>
            </button>
            <p className="text-gray-400 text-sm">
                Premium arcade and interactive game rentals for unforgettable events.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4 font-poppins">Quick Links</h4>
            <ul className="space-y-2 text-gray-400">
                <li><button onClick={() => window.location.hash = '#/services'} className="hover:text-brand-accent">Services</button></li>
                <li><button onClick={() => window.location.hash = '#/gallery'} className="hover:text-brand-accent">Gallery</button></li>
                <li><button onClick={() => window.location.hash = '#/blog'} className="hover:text-brand-accent">Blog</button></li>
                <li><button onClick={() => window.location.hash = '#/contact'} className="hover:text-brand-accent">Contact</button></li>
            </ul>
          </div>
          
          {/* Company */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4 font-poppins">Company</h4>
            <ul className="space-y-2 text-gray-400">
                <li><button onClick={() => window.location.hash = '#/about'} className="hover:text-brand-accent">About Us</button></li>
                <li><button onClick={() => window.location.hash = '#/terms'} className="hover:text-brand-accent">Terms of Service</button></li>
                <li><button onClick={() => window.location.hash = '#/privacy'} className="hover:text-brand-accent">Privacy Policy</button></li>
                <li><a href="a href="/api/sitemap" target="_blank" rel="noopener noreferrer" className="hover:text-brand-accent">Sitemap</a></li>
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4 font-poppins">Follow Us</h4>
            <div className="flex justify-center md:justify-start space-x-4">
               {settings.socials.facebook && <a href={settings.socials.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-brand-accent" aria-label="Facebook"><FacebookIcon /></a>}
               {settings.socials.instagram && <a href={settings.socials.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-brand-accent" aria-label="Instagram"><InstagramIcon /></a>}
               {settings.socials.twitter && <a href={settings.socials.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-brand-accent" aria-label="Twitter"><TwitterIcon /></a>}
               {settings.socials.linkedin && <a href={settings.socials.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-brand-accent" aria-label="LinkedIn"><LinkedInIcon /></a>}
               {settings.whatsapp_number && <a href={`https://wa.me/${settings.whatsapp_number}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-brand-accent" aria-label="WhatsApp"><WhatsAppIcon /></a>}
            </div>
          </div>
        </div>
      </div>
      <div className="bg-black/20 py-4">
          <div className="container mx-auto px-6 text-center text-sm text-gray-500 flex justify-between items-center">
            <p>&copy; {new Date().getFullYear()} {settings.business_name}. All Rights Reserved.</p>
            <button onClick={() => window.location.hash = '#/admin'} className="text-xs hover:text-brand-accent transition-colors">Admin Login</button>
          </div>
      </div>
    </footer>
  );
};

export default Footer;
