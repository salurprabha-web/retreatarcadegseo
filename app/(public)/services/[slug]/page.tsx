import ServiceDetailPage from '@/components/public/ServiceDetailPage';
import { createClient } from '@/lib/supabase/server';
import { Service, SiteSettings } from '@/types';
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
  const { data: service } = await supabase.from('services').select('name, description, seo').eq('seo->>slug', params.slug).single<Pick<Service, 'name' | 'description' | 'seo'>>();
 
  if (!service) {
    return {
      title: 'Service Not Found',
    }
  }
 
  return {
    title: `${service.seo.metaTitle} | Retreat Arcade`,
    description: service.seo.metaDescription,
  }
}

export async function generateStaticParams() {
  const supabase = createClient();
  const { data: services } = await supabase.from('services').select('seo').returns<Pick<Service, 'seo'>[]>();
 
  return services?.map((service) => ({
    slug: service.seo.slug,
  })) || [];
}


export default async function Page({ params }: { params: { slug: string } }) {
    const supabase = createClient();
    
    const servicePromise = supabase.from('services').select('*').eq('seo->>slug', params.slug).single<Service>();
    const allServicesPromise = supabase.from('services').select('id, name').returns<{id: string, name: string}[]>();
    const settingsPromise = supabase.from('site_settings').select('*').limit(1).single<SiteSettings>();

    const [{ data: service }, { data: allServices }, { data: settings }] = await Promise.all([
        servicePromise,
        allServicesPromise,
        settingsPromise,
    ]);

    if (!service) {
        notFound();
    }
    
    if (!settings) {
        // Handle case where settings are not found but service is
        throw new Error("Site settings could not be loaded.");
    }

    // A more efficient way to get related services without fetching all full services again
    const relatedServiceIds = service.related_service_ids || [];
    const { data: relatedServices } = await supabase.from('services').select('*').in('id', relatedServiceIds).returns<Service[]>();

    return <ServiceDetailPage service={service} relatedServices={relatedServices || []} settings={settings} />;
}
