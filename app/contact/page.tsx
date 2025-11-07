import type { Metadata } from 'next';
import { ContactClient } from './contact-client';
import { getSiteSettings } from '@/lib/settings';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: "Get in touch with us to discuss your event needs",
};

export default async function ContactPage() {
  const settings = await getSiteSettings();

  return (
    <div className="min-h-screen">
      <div
        className="relative h-96 flex items-center justify-center"
        style={{
          backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 text-center px-4">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            Contact Us
          </h1>
          <p className="text-xl text-gray-200 max-w-2xl mx-auto">
            Let's discuss how we can make your event extraordinary
          </p>
        </div>
      </div>

      <ContactClient
        contactInfo={{
          email: settings.contact_email,
          phone: settings.contact_phone,
          address: settings.address,
        }}
      />
    </div>
  );
}
