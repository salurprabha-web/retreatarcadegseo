import { supabase } from './supabase';

export type SiteSettings = {
  site_name: string;
  site_tagline: string;
  contact_email: string;
  contact_phone: string;
  whatsapp_number: string;
  address: string;
  social_facebook: string;
  social_instagram: string;
  social_twitter: string;
  social_linkedin: string;
};

const defaultSettings: SiteSettings = {
  site_name: 'Nirvahana Utsav',
  site_tagline: 'Premium Event Management & Cultural Celebrations',
  contact_email: 'info@nirvahanautsav.com',
  contact_phone: '+91 1234567890',
  whatsapp_number: '+91 1234567890',
  address: 'India',
  social_facebook: '',
  social_instagram: '',
  social_twitter: '',
  social_linkedin: '',
};

export async function getSiteSettings(): Promise<SiteSettings> {
  const { data, error } = await supabase
    .from('site_settings')
    .select('key, value');

  if (error) {
    console.error('Error fetching site settings:', error);
    return defaultSettings;
  }

  if (!data || data.length === 0) {
    return defaultSettings;
  }

  const settings: any = { ...defaultSettings };

  data.forEach((item) => {
    if (item.value && typeof item.value === 'object' && 'text' in item.value) {
      settings[item.key] = item.value.text || defaultSettings[item.key as keyof SiteSettings];
    }
  });

  return settings;
}
