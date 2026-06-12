import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Navbar } from '@/components/navigation/navbar';
import { Footer } from '@/components/navigation/footer';
import { WhatsAppButtonWrapper } from '@/components/whatsapp-button-wrapper';
import { Toaster } from '@/components/ui/sonner';
import { SITE_NAME, SITE_TAGLINE, SITE_DESCRIPTION } from '@/lib/constants';
import { getSiteSettings } from '@/lib/settings';

const inter = Inter({ subsets: ['latin'] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.retreatarcade.in';

// Static metadata export — uses constants only (no DB calls here)
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${SITE_NAME} - ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    'event management Hyderabad',
    'interactive games rental Hyderabad',
    'photo booth rental Hyderabad',
    'corporate event activities Hyderabad',
    'team building activities Hyderabad',
    'brand activation Hyderabad',
    '360 photo booth Hyderabad',
    'employee engagement activities',
    'college fest games rental',
    'VR simulator hire Hyderabad',
  ],
  authors: [{ name: SITE_NAME }],
  alternates: { canonical: siteUrl },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: SITE_NAME,
    title: `${SITE_NAME} - ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    url: siteUrl,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} - ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
};

// Root layout is a server component — can fetch CMS data for <head> tags
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // ✅ CMS-controlled: phone, email, address, socials, og_image, google verification
  const settings = await getSiteSettings();

  const ogImage = settings.og_image_url || `${siteUrl}/og-image.jpg`;

  // LocalBusiness schema — all values from CMS settings
  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: settings.site_name,
    description: SITE_DESCRIPTION,
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    image: ogImage,
    telephone: settings.contact_phone,
    email: settings.contact_email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: settings.address,
      addressLocality: 'Madhapur',
      addressRegion: 'Telangana',
      postalCode: '500084',
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 17.3850,
      longitude: 78.4867,
    },
    areaServed: [
      { '@type': 'City', name: 'Hyderabad' },
      { '@type': 'City', name: 'Madhapur' },
      { '@type': 'City', name: 'HITEC City' },
      { '@type': 'City', name: 'Gachibowli' },
      { '@type': 'City', name: 'Secunderabad' },
    ],
    sameAs: [
      settings.social_facebook,
      settings.social_instagram,
      settings.social_twitter,
      settings.social_linkedin,
    ].filter(Boolean),
    openingHours: 'Mo-Su 09:00-21:00',
    priceRange: '₹₹',
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/*
          ✅ HARDCODED — geo tags represent your physical location.
          These never need to change via CMS. Hyderabad is always your base.
        */}
        <meta name="geo.region" content="IN-TG" />
        <meta name="geo.placename" content="Hyderabad" />
        <meta name="geo.position" content="17.3850;78.4867" />
        <meta name="ICBM" content="17.3850, 78.4867" />

        {/*
          ✅ CMS-controlled — go to Admin > Settings, add key: google_site_verification
          with your verification code from Google Search Console
        */}
        {settings.google_site_verification && (
          <meta
            name="google-site-verification"
            content={settings.google_site_verification}
          />
        )}

        {/*
          ✅ CMS-controlled og:image — set key: og_image_url in Admin > Settings
          Falls back to /public/og-image.jpg if not set
        */}
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:image" content={ogImage} />

        {/* ✅ LocalBusiness JSON-LD — all values from CMS settings */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
      </head>
      <body className={inter.className}>
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <WhatsAppButtonWrapper />
        <Toaster />
      </body>
    </html>
  );
}
