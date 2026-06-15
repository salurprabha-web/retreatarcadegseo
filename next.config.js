/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  experimental: {
    serverComponentsExternalPackages: [],
  },
  images: {
    // ✅ REMOVED: unoptimized: true — was disabling WebP conversion and resizing,
    // hurting Core Web Vitals (LCP). Next.js now optimises all images automatically.
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'images.pexels.com' },
      { protocol: 'https', hostname: 'drive.google.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      // ✅ ADDED: Cloudinary — needed for Next/Image to optimise your product images
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },

  async redirects() {
    return [
      // ── 301 redirects: old long slugs → clean current slugs ──────────────
      // These were indexed by Google but the slugs changed in the CMS.
      // 301 = permanent redirect — Google transfers all ranking signals to new URL.
      {
        source: '/events/word-cloud-photo-booth-rental',
        destination: '/events/word-cloud-photobooth-rental',
        permanent: true,
      },
      {
        source: '/events/kaleidoscope-photobooth-rental-18000-inr-create-mesmerizing-memories-in-hyderabad-and-other-cities',
        destination: '/events/kaleidoscope-photobooth-rental',
        permanent: true,
      },
      {
        source: '/events/magazine-photobooth-rental-celebrity-style-photoshoot-experience',
        destination: '/events/magazine-photobooth-rental',
        permanent: true,
      },
      {
        source: '/events/ai-photobooth-rental-smart-on-brand-photos',
        destination: '/events/ai-photobooth-rental',
        permanent: true,
      },
      {
        source: '/events/digital-touch-screen-skill-puzzle-games-rental-in-hyderabad',
        destination: '/events/digital-touch-screen-skill-puzzle-games-rental',
        permanent: true,
      },
      {
        source: '/events/digital-slingshot-game-rental-interactive-sensor-based-target-game-for-events',
        destination: '/events/digital-slingshot-game-rental',
        permanent: true,
      },
      {
        source: '/events/augmented-reality-photo-booth-rental-immersive-ar-experience-for-events',
        destination: '/events/augmented-reality-photo-booth-rental',
        permanent: true,
      },
      {
        source: '/events/bobble-head-photo-booth-activity-rental-fun-animated-photo-experience',
        destination: '/events/bobble-head-photo-booth-activity-rental',
        permanent: true,
      },
      {
        source: '/events/magic-mirror-photo-booth-rental-interactive-selfie-mirror-for-events',
        destination: '/events/magic-mirror-photo-booth-rental',
        permanent: true,
      },
      {
        source: '/events/strip-photo-booth-rental-vintage-style-instant-prints-for-weddings-events',
        destination: '/events/strip-photo-booth-rental',
        permanent: true,
      },
      {
        source: '/events/catch-the-baton-game-rental-high-energy-interactive-challenge-for-events',
        destination: '/events/catch-the-baton-game-rental',
        permanent: true,
      },
      // Google crawled /api/sitemap — redirect to correct sitemap URL
      {
        source: '/api/sitemap',
        destination: '/sitemap.xml',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
