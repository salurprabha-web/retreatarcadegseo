import Link from 'next/link';
import { Facebook, Instagram, Twitter, Linkedin, Mail, Phone, MapPin } from 'lucide-react';
import { NAV_ITEMS } from '@/lib/constants';
import { getSiteSettings } from '@/lib/settings';

export async function Footer() {
  const currentYear = new Date().getFullYear();
  const settings = await getSiteSettings();

  return (
    <footer className="bg-gradient-to-br from-charcoal-950 via-charcoal-900 to-charcoal-950 text-cream-300 border-t border-terracotta-500/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div>
            <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-terracotta-400 to-terracotta-600 bg-clip-text text-transparent">
              {settings.site_name}
            </h3>
            <p className="text-sm mb-6 text-cream-400 leading-relaxed">
              {settings.site_tagline || 'Creating unforgettable moments through expert event management and cultural celebrations.'}
            </p>
            <div className="flex space-x-4">
              {settings.social_facebook && (
                <a
                  href={settings.social_facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-charcoal-800 flex items-center justify-center hover:bg-terracotta-500 transition-all duration-300 group"
                >
                  <Facebook className="h-5 w-5 text-cream-300 group-hover:text-white" />
                </a>
              )}
              {settings.social_instagram && (
                <a
                  href={settings.social_instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-charcoal-800 flex items-center justify-center hover:bg-terracotta-500 transition-all duration-300 group"
                >
                  <Instagram className="h-5 w-5 text-cream-300 group-hover:text-white" />
                </a>
              )}
              {settings.social_twitter && (
                <a
                  href={settings.social_twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-charcoal-800 flex items-center justify-center hover:bg-terracotta-500 transition-all duration-300 group"
                >
                  <Twitter className="h-5 w-5 text-cream-300 group-hover:text-white" />
                </a>
              )}
              {settings.social_linkedin && (
                <a
                  href={settings.social_linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-charcoal-800 flex items-center justify-center hover:bg-terracotta-500 transition-all duration-300 group"
                >
                  <Linkedin className="h-5 w-5 text-cream-300 group-hover:text-white" />
                </a>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-cream-50 font-semibold mb-6 text-lg">Quick Links</h4>
            <ul className="space-y-3">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-cream-400 hover:text-terracotta-400 transition-colors flex items-center group"
                  >
                    <span className="w-0 h-0.5 bg-terracotta-500 group-hover:w-4 mr-0 group-hover:mr-2 transition-all duration-300"></span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-cream-50 font-semibold mb-6 text-lg">Services</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/services" className="text-cream-400 hover:text-terracotta-400 transition-colors flex items-center group">
                  <span className="w-0 h-0.5 bg-terracotta-500 group-hover:w-4 mr-0 group-hover:mr-2 transition-all duration-300"></span>
                  Wedding Planning
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-cream-400 hover:text-terracotta-400 transition-colors flex items-center group">
                  <span className="w-0 h-0.5 bg-terracotta-500 group-hover:w-4 mr-0 group-hover:mr-2 transition-all duration-300"></span>
                  Corporate Events
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-cream-400 hover:text-terracotta-400 transition-colors flex items-center group">
                  <span className="w-0 h-0.5 bg-terracotta-500 group-hover:w-4 mr-0 group-hover:mr-2 transition-all duration-300"></span>
                  Cultural Festivals
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-cream-400 hover:text-terracotta-400 transition-colors flex items-center group">
                  <span className="w-0 h-0.5 bg-terracotta-500 group-hover:w-4 mr-0 group-hover:mr-2 transition-all duration-300"></span>
                  Private Celebrations
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-cream-50 font-semibold mb-6 text-lg">Contact Us</h4>
            <ul className="space-y-4">
              {settings.contact_email && (
                <li className="flex items-start space-x-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-terracotta-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Mail className="h-4 w-4 text-terracotta-400" />
                  </div>
                  <a href={`mailto:${settings.contact_email}`} className="text-cream-400 hover:text-terracotta-400 transition-colors break-all">
                    {settings.contact_email}
                  </a>
                </li>
              )}
              {settings.contact_phone && (
                <li className="flex items-start space-x-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-gold-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Phone className="h-4 w-4 text-gold-400" />
                  </div>
                  <a href={`tel:${settings.contact_phone}`} className="text-cream-400 hover:text-terracotta-400 transition-colors">
                    {settings.contact_phone}
                  </a>
                </li>
              )}
              {settings.address && (
                <li className="flex items-start space-x-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-cream-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin className="h-4 w-4 text-cream-400" />
                  </div>
                  <span className="text-cream-400">{settings.address}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="border-t border-terracotta-500/10 mt-12 pt-8 text-center">
          <p className="text-sm text-cream-400">© {currentYear} {settings.site_name}. All rights reserved. Crafted with excellence.</p>
        </div>
      </div>
    </footer>
  );
}
