import ServicesPage from '@/components/public/ServicesPage';
import { createClient } from '@/lib/supabase/server';
import { Service } from '@/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Our Experiences | Retreat Arcade',
  description: 'Explore our full collection of luxury arcade and interactive game rentals for weddings, corporate events, and exclusive parties.',
};

export default async function Page() {
  const supabase = createClient();
  const { data: services, error } = await supabase.from('services').select('*').order('created_at').returns<Service[]>();
  
  if (error) {
    console.error("Services page fetch error:", error.message);
  }

  return <ServicesPage services={services || []} />;
}
