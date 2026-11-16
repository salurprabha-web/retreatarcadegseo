'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Inbox, Package, Layers, Star, Home, Info, FileText, Image as ImageIcon,
  Sparkles, Search, PenLine, Settings, LogOut, ExternalLink, Menu, X, ChevronDown, ArrowLeft, HelpCircle, Wrench,
} from 'lucide-react';
import { signOut } from '@/lib/supabase-client';
import { helpFor } from '@/components/admin/admin-help';

type Item = { label: string; href: string; icon: any; hint: string; badge?: string };

const GROUPS: { title: string; items: Item[] }[] = [
  {
    title: 'Start',
    items: [{ label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, hint: 'Overview and common tasks' }],
  },
  {
    title: 'Leads',
    items: [{ label: 'Enquiries', href: '/admin/enquiries', icon: Inbox, hint: 'People who want a quote' }],
  },
  {
    title: 'What you sell',
    items: [
      { label: 'Add product with AI', href: '/admin/products-ai', icon: Sparkles, hint: 'AI writes the page, SEO and city pages', badge: 'New' },
      { label: 'Products', href: '/admin/events', icon: Package, hint: 'Games, booths, VR...' },
      { label: 'Services', href: '/admin/services', icon: Layers, hint: 'Groups of products' },
      { label: 'Our work (case studies)', href: '/admin/case-studies', icon: Star, hint: 'Real events with photos', badge: 'New' },
      { label: 'Testimonials', href: '/admin/testimonials', icon: Star, hint: 'Customer reviews' },
    ],
  },
  {
    title: 'Grow on Google',
    items: [
      { label: 'Auto Pages (AI)', href: '/admin/auto-pages', icon: Sparkles, hint: 'Cities and city pages' },
      { label: 'Title fixer', href: '/admin/seo-titles', icon: Search, hint: 'Shorten titles Google cuts off', badge: 'New' },
      { label: 'Keywords', href: '/admin/keywords', icon: Search, hint: 'One owner page per search phrase', badge: 'New' },
      { label: 'AI Blog writer', href: '/admin/blog-ai', icon: PenLine, hint: 'Write, approve and schedule posts', badge: 'New' },
    ],
  },
  {
    title: 'Website content',
    items: [
      { label: 'Homepage text', href: '/admin/homepage', icon: Home, hint: 'Top of the homepage' },
      { label: 'About page', href: '/admin/about', icon: Info, hint: 'Company story' },
      { label: 'Blog', href: '/admin/blog', icon: FileText, hint: 'Articles' },
      { label: 'Photos & media', href: '/admin/media', icon: ImageIcon, hint: 'Image links' },
    ],
  },
  {
    title: 'Settings',
    items: [{ label: 'Site settings', href: '/admin/settings', icon: Settings, hint: 'Phone, email, links' }],
  },
];

const OLD_TOOLS: Item[] = [
  { label: 'Cities (basic list)', href: '/admin/locations', icon: Wrench, hint: 'Use Auto Pages instead' },
  { label: 'Old city pages', href: '/admin/location-pages', icon: Wrench, hint: 'Not used by the website' },
  { label: 'Services x cities map', href: '/admin/locations/services-map', icon: Wrench, hint: 'Old overview' },
];

function isActive(pathname: string, href: string) {
  if (href === '/admin/dashboard') return pathname === href;
  // "/admin/locations" must not light up for "/admin/locations/services-map"
  if (href === '/admin/locations') return pathname === href;
  return pathname === href || pathname.startsWith(href + '/');
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [oldOpen, setOldOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(true);
  // many pages draw their own big heading; then the guide box does not repeat the title
  const [ownHeading, setOwnHeading] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  const isLogin = pathname === '/admin' || pathname === '/admin/';
  const help = helpFor(pathname);
  const onDashboard = pathname === '/admin/dashboard';

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    try {
      const v = localStorage.getItem('admin-help-closed:' + pathname);
      setHelpOpen(v !== '1');
    } catch {
      setHelpOpen(true);
    }
  }, [pathname]);
  useEffect(() => {
    if (OLD_TOOLS.some((i) => isActive(pathname, i.href))) setOldOpen(true);
  }, [pathname]);

  useEffect(() => {
    setOwnHeading(false);
    const el = bodyRef.current;
    if (!el) return;
    const check = () => {
      const h = el.querySelector('h1, h2');
      setOwnHeading(!!h && (h.textContent || '').trim().length > 0);
    };
    check();
    const mo = new MutationObserver(check);
    mo.observe(el, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, [pathname]);

  const toggleHelp = () => {
    const next = !helpOpen;
    setHelpOpen(next);
    try {
      localStorage.setItem('admin-help-closed:' + pathname, next ? '0' : '1');
    } catch {}
  };

  const logout = async () => {
    await signOut();
    router.push('/admin');
    router.refresh();
  };

  // the login page has no menu
  if (isLogin) return <div className="min-h-screen bg-gray-50">{children}</div>;

  const NavLink = ({ item }: { item: Item }) => {
    const Icon = item.icon;
    const active = isActive(pathname, item.href);
    return (
      <Link
        href={item.href}
        title={item.hint}
        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
          active ? 'bg-orange-50 font-semibold text-orange-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`}
      >
        <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-orange-600' : 'text-gray-400'}`} />
        <span className="truncate">{item.label}</span>
        {item.badge && <span className="ml-auto rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white">{item.badge}</span>}
      </Link>
    );
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="border-b px-5 py-4">
        <p className="text-lg font-bold text-orange-600">Retreat Arcade</p>
        <p className="text-xs text-gray-400">Admin panel</p>
      </div>
      <div className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {GROUPS.map((g) => (
          <div key={g.title}>
            <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">{g.title}</p>
            <div className="space-y-0.5">
              {g.items.map((i) => (
                <NavLink key={i.href} item={i} />
              ))}
            </div>
          </div>
        ))}
        <div>
          <button onClick={() => setOldOpen(!oldOpen)} className="flex w-full items-center justify-between px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-600">
            Old tools (you can ignore)
            <ChevronDown className={`h-3.5 w-3.5 transition ${oldOpen ? 'rotate-180' : ''}`} />
          </button>
          {oldOpen && (
            <div className="mt-1 space-y-0.5">
              {OLD_TOOLS.map((i) => (
                <NavLink key={i.href} item={i} />
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="space-y-1 border-t px-3 py-3">
        <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100">
          <ExternalLink className="h-4 w-4 text-gray-400" /> View website
        </a>
        <button onClick={logout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-red-50 hover:text-red-600">
          <LogOut className="h-4 w-4 text-gray-400" /> Log out
        </button>
        <p className="px-3 pt-1 text-[11px] text-gray-400">Version {process.env.NEXT_PUBLIC_BUILD_ID}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <meta name="robots" content="noindex,nofollow" />
      {/* the old per-page top bars (title + Back + Logout) are replaced by this menu and the help box */}
      <style>{`.admin-body nav { display: none !important; }`}</style>

      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-white lg:block">{sidebar}</aside>

      {/* mobile top bar + drawer */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-white px-4 lg:hidden">
        <p className="font-bold text-orange-600">Retreat Arcade</p>
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="rounded-lg p-2 text-gray-600 hover:bg-gray-100">
          <Menu className="h-5 w-5" />
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 bg-white shadow-xl">
            <button onClick={() => setOpen(false)} aria-label="Close menu" className="absolute right-3 top-3 rounded-lg p-2 text-gray-500 hover:bg-gray-100">
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </div>
        </div>
      )}

      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6">
          {help && !onDashboard && (
            <div className="admin-guide mb-6 rounded-2xl p-4">
              {help.back && (
                <Link href={help.back.href} className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:underline">
                  <ArrowLeft className="h-3.5 w-3.5" /> {help.back.label}
                </Link>
              )}
              <div className="flex items-start justify-between gap-3">
                <div>
                  {ownHeading ? (
                    <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700">About this page</p>
                  ) : (
                    <h1 className="text-xl font-bold text-gray-900">{help.title}</h1>
                  )}
                  <p className="mt-0.5 text-sm text-gray-600">{help.about}</p>
                </div>
                {(help.steps || help.tips) && (
                  <button onClick={toggleHelp} className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100">
                    <HelpCircle className="h-4 w-4" /> {helpOpen ? 'Hide help' : 'Show help'}
                  </button>
                )}
              </div>
              {helpOpen && (help.steps || help.tips) && (
                <div className="mt-3 grid gap-4 text-sm text-gray-700 md:grid-cols-2">
                  {help.steps && (
                    <div>
                      <p className="mb-1 font-semibold text-gray-900">How to use this page</p>
                      <ol className="list-decimal space-y-1 pl-5">
                        {help.steps.map((s) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                  {help.tips && (
                    <div>
                      <p className="mb-1 font-semibold text-gray-900">Good to know</p>
                      <ul className="list-disc space-y-1 pl-5">
                        {help.tips.map((s) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <div className="admin-body" ref={bodyRef}>{children}</div>
        </div>
      </main>
    </div>
  );
}
