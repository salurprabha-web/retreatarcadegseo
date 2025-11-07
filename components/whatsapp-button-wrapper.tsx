import { WhatsAppButton } from './whatsapp-button';
import { getSiteSettings } from '@/lib/settings';

export async function WhatsAppButtonWrapper() {
  const settings = await getSiteSettings();

  if (!settings.whatsapp_number) {
    return null;
  }

  return <WhatsAppButton whatsappNumber={settings.whatsapp_number} />;
}
