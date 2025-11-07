import ContentPage from '@/components/public/ContentPage';
import { createClient } from '@/lib/supabase/server';
import { ContentPage as ContentPageType } from '@/types';
import { notFound } from 'next/navigation';
import type { Metadata, ResolvingMetadata } from 'next';

type Props = {
  params: { slug: string }
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const supabase = createClient();
  const { data: page } = await supabase.from('content_pages').select('seo').eq('seo->>slug', params.slug).single<Pick<ContentPageType, 'seo'>>();
 
  if (!page) {
    return {
      title: 'Page Not Found',
    }
  }
 
  return {
    title: `${page.seo.metaTitle} | Retreat Arcade`,
    description: page.seo.metaDescription,
  }
}

export async function generateStaticParams() {
  const supabase = createClient();
  const { data: pages } = await supabase.from('content_pages').select('seo').returns<Pick<ContentPageType, 'seo'>[]>();
 
  return pages?.map((page) => ({
    slug: page.seo.slug,
  })) || [];
}

export default async function Page({ params }: { params: { slug: string } }) {
    const supabase = createClient();
    const { data: page } = await supabase.from('content_pages').select('*').eq('seo->>slug', params.slug).single<ContentPageType>();

    if (!page) {
        notFound();
    }

    return <ContentPage page={page} />;
}
