'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Package, Wrench, FileText, Box } from 'lucide-react';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { supabase } from '@/lib/supabase';
import { DialogTitle } from '@/components/ui/dialog';

type Item = { title: string; href: string; hint?: string };

const PAGES: Item[] = [
  { title: 'Plan your event in 3D', href: '/plan-your-event', hint: 'Interactive planner' },
  { title: 'All products', href: '/events' },
  { title: 'All services', href: '/services' },
  { title: 'Gallery', href: '/gallery' },
  { title: 'Blog', href: '/blog' },
  { title: 'About us', href: '/about' },
  { title: 'Contact & free quote', href: '/contact' },
];

/** Ctrl/⌘+K command palette: instant search across products and services. */
export function SiteSearch({ className = '' }: { className?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<Item[]>([]);
  const [services, setServices] = useState<Item[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // load once, the first time the palette opens
  useEffect(() => {
    if (!open || loaded) return;
    setLoaded(true);
    (async () => {
      const [ev, sv] = await Promise.all([
        supabase.from('events').select('title, slug, category, price').eq('status', 'published').order('title'),
        supabase.from('services').select('title, slug').eq('status', 'published').order('title'),
      ]);
      setProducts(
        (ev.data || []).map((e: any) => ({
          title: e.title,
          href: `/events/${e.slug}`,
          hint: [e.category, e.price ? `from ₹${Number(e.price).toLocaleString('en-IN')}` : null].filter(Boolean).join(' · '),
        }))
      );
      setServices((sv.data || []).map((s: any) => ({ title: s.title, href: `/services/${s.slug}` })));
    })();
  }, [open, loaded]);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router]
  );

  const group = (heading: string, items: Item[], Icon: typeof Package) =>
    items.length > 0 && (
      <CommandGroup heading={heading}>
        {items.map((i) => (
          <CommandItem key={i.href} value={`${i.title} ${i.hint || ''}`} onSelect={() => go(i.href)} className="gap-3">
            <Icon className="h-4 w-4 text-orange-500" />
            <span className="flex-1">{i.title}</span>
            {i.hint && <span className="text-xs text-muted-foreground">{i.hint}</span>}
          </CommandItem>
        ))}
      </CommandGroup>
    );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search products and services"
        className={`inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-sm text-cream-200 transition hover:border-orange-400/60 hover:text-white ${className}`}
      >
        <Search className="h-4 w-4" />
        <span className="hidden lg:inline">Search</span>
        <kbd className="hidden rounded border border-white/15 px-1.5 text-[10px] text-white/50 lg:inline">Ctrl K</kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen} contentClassName="dark border-white/15 bg-[#0b1030] text-white">
          <DialogTitle className="sr-only">Search Retreat Arcade</DialogTitle>
          <CommandInput placeholder="Search products, services, pages…" />
          <CommandList>
            <CommandEmpty>No results. Try “photo booth”, “VR” or “team building”.</CommandEmpty>
            {group('Quick links', PAGES, Box)}
            {group('Products', products, Package)}
            {group('Services', services, Wrench)}
          </CommandList>
      </CommandDialog>
    </>
  );
}
