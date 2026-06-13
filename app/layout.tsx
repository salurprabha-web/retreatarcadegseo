import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import { Navbar } from '@/components/navigation/navbar';
import { Footer } from '@/components/navigation/footer';
import { WhatsAppButtonWrapper } from '@/components/whatsapp-button-wrapper';
import { Toaster } from '@/components/ui/sonner';
import { SITE_NAME, SITE_TAGLINE, SITE_DESCRIPTION } from '@/lib/constants';
import { getSiteSettings } from '@/lib/settings';

const inter = Inter({ subsets: ['latin'] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.retreatarcade.in';

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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();

  const ogImage = settings.og_image_url || `${siteUrl}/og-image.jpg`;

  // ✅ GA4 ID from CMS — falls back to hardcoded if not set in DB
  const gaId = settings.ga_measurement_id || 'G-FYZ0VPSZCY';

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
        <meta name="geo.region" content="IN-TG" />
        <meta name="geo.placename" content="Hyderabad" />
        <meta name="geo.position" content="17.3850;78.4867" />
        <meta name="ICBM" content="17.3850, 78.4867" />

        {settings.google_site_verification && (
          <meta name="google-site-verification" content={settings.google_site_verification} />
        )}

        <meta property="og:image" content={ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:image" content={ogImage} />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
      </head>
      <body className={inter.className}>

        {/* ✅ Google Analytics 4 — loads after page is interactive, doesn't block render */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
          strategy="afterInteractive"
        />
        <Script id="ga4-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}', {
              page_path: window.location.pathname,
            });
          `}
        </Script>

        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <WhatsAppButtonWrapper />
        <Toaster />
      </body>
    </html>
  );
}
