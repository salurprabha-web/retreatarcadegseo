// app/events/[slug]/[location]/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { convertToDirectImageUrl } from '@/lib/image-utils';
import dynamicImport from 'next/dynamic';

type Props = { params: { slug: string; location: string } };

const GalleryClient = dynamicImport<any>(() => import('@/app/components/gallery-client').then(m => m?.default ?? m), { ssr: false });

export const revalidate = 0;
export const dynamic = 'force-dynamic';

async function getEventBySlug(slug: string) {
  const { data, error } = await supabase.from('events').select('*').eq('slug', slug).eq('status', 'published').maybeSingle();
  if (error) console.error('getEventBySlug', error);
  return data;
}

/* ... keep your generateMetadata & default export logic similar to services page,
   but using 'events' table and product_type = 'event' when querying location_pages */

