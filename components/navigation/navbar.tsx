'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X, MessageCircle } from 'lucide-react';
import { NAV_ITEMS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { SiteSearch } from '@/components/search/site-search';

// Floating glass "control deck" navigation. All NAV_ITEMS stay as real links
// (same internal-link structure as before); "Get Started" remains a distinct
// WhatsApp CTA so it never duplicates "Contact".

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname() || '/';

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3 sm:px-4 sm:pt-4">
      <nav
        aria-label="Main navigation"
        className={cn(
          'glass flex w-full max-w-6xl items-center justify-between rounded-full px-4 transition-all duration-500 sm:px-6',
          isScrolled ? 'h-14 shadow-[0_20px_60px_-20px_rgba(251,146,60,0.35)]' : 'h-[68px]'
        )}
      >
        <Link href="/" className="group flex items-center" aria-label="Retreat Arcade home">
          <Image
            src="/logo.png"
            alt="Retreat Arcade Logo"
            width={52}
            height={52}
            className={cn('object-contain transition-all duration-500 group-hover:scale-105', isScrolled ? 'h-11 w-11' : 'h-[52px] w-[52px]')}
            priority
          />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => {
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative rounded-full px-3.5 py-2 text-sm font-medium transition-all hover:-translate-y-0.5',
                  active ? 'bg-white/10 text-white' : 'text-white/75 hover:bg-white/5 hover:text-white'
                )}
              >
                {item.label}
                {active && (
                  <span className="absolute -bottom-0.5 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-gradient-to-r from-orange-400 to-pink-500" />
                )}
              </Link>
            );
          })}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <SiteSearch />
          <a
            href="https://wa.me/917993912762"
            target="_blank"
            rel="noopener noreferrer"
            data-magnetic="1"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#128C4A] px-4 py-2 text-sm font-bold text-white shadow-lg shadow-green-900/30 transition hover:bg-[#0f7a40]"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
        </div>

        <button
          className="rounded-full p-2 text-white md:hidden"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {open && (
        <div
          id="mobile-menu"
          className="glass absolute inset-x-3 top-[84px] rounded-3xl p-5 md:hidden"
        >
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-2xl px-4 py-3 text-lg font-semibold text-white transition hover:bg-white/10"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="mt-4 space-y-3">
            <SiteSearch className="w-full justify-center" />
            <a
              href="https://wa.me/917993912762"
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#128C4A] py-3 font-bold text-white"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp Us
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
