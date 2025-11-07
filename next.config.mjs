/** @type {import('next').NextConfig} */
const nextConfig = {
    // This configuration remaps the environment variables provided on Vercel
    // (VITE_...) to the names Next.js expects for client-side code (NEXT_PUBLIC_...).
    env: {
        NEXT_PUBLIC_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
    }
};

export default nextConfig;