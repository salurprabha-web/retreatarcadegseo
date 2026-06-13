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
};

module.exports = nextConfig;
