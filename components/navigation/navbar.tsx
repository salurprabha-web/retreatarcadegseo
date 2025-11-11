'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NAV_ITEMS } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-charcoal-950/95 backdrop-blur-lg shadow-2xl border-b border-terracotta-500/10'
          : 'bg-charcoal-950/80 backdrop-blur-md'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* ✅ LOGO */}
          <Link href="/" className="flex items-center space-x-2 group">
            <Image
              src="/logo.png"
              alt="Retreat Arcade Logo"
              width={140}
              height={40}
              className="object-contain transition-opacity group-hover:opacity-80"
              priority
            />
          </Link>

          {/* ✅ DESKTOP MENU */}
          <div className="hidden md:flex items-center space-x-8">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-cream-200 hover:text-terracotta-400 transition-colors relative group"
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-terracotta-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
            ))}
            <Button
              asChild
              className="bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-full px-6 shadow-lg shadow-terracotta-900/50"
            >
              <Link href="/contact">Get Started</Link>
            </Button>
          </div>

          {/* ✅ MOBILE MENU TOGGLE */}
          <button
            className="md:hidden p-2 text-cream-200 hover:text-terracotta-400 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* ✅ MOBILE MENU */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-charcoal-900/95 backdrop-blur-lg border-t border-terracotta-500/10">
          <div className="px-4 py-4 space-y-3">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block py-2 text-cream-200 hover:text-terracotta-400 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Button
              asChild
              className="w-full bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-full"
            >
              <Link href="/contact">Get Started</Link>
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
