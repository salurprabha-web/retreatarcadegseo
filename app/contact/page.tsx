import type { Metadata } from 'next';
import { ContactClient } from './contact-client';
import { getSiteSettings } from '@/lib/settings';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.retreatarcade.in';

export const metadata: Metadata = {
  title: 'Contact Retreat Arcade | Book Event Games & Photo Booths',
  description: 'Get in touch with Retreat Arcade to book interactive games, photo booths or event entertainment. Call, WhatsApp or fill the enquiry form.',
  alternates: { canonical: `${siteUrl}/contact` },
  openGraph: { title: 'Contact Retreat Arcade', url: `${siteUrl}/contact` },
};

export default async function ContactPage() {
  const settings = await getSiteSettings();


  const contactSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact Retreat Arcade",
    url: "https://www.retreatarcade.in/contact",
    description: "Contact Retreat Arcade for interactive game rentals, photo booths, VR simulators and event entertainment across India.",
    mainEntity: {
      "@type": "LocalBusiness",
      name: "Retreat Arcade",
      telephone: "+91-9063679687",
      email: "info@retreatarcade.in",
      url: "https://www.retreatarcade.in",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Ayyappa Society, Madhapur",
        addressLocality: "Hyderabad",
        addressRegion: "Telangana",
        postalCode: "500084",
        addressCountry: "IN",
      },
      openingHoursSpecification: [
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
          opens: "09:00",
          closes: "21:00",
        },
      ],
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(contactSchema) }} />
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
    </>
  );
}
