import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'brand-dark': '#111827',
        'brand-secondary': '#1F2937',
        'brand-light': '#F9FAFB',
        'brand-accent': '#FBBF24',
        'brand-accent-hover': '#F59E0B',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        poppins: ['var(--font-poppins)', 'sans-serif'],
      },
      keyframes: {
        kenburns: {
          '0%': { transform: 'scale(1) translateY(0)', 'transform-origin': 'center center' },
          '100%': { transform: 'scale(1.1) translateY(-10px)', 'transform-origin': 'center center' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        kenburns: 'kenburns 15s ease-out forwards',
        'fade-in-up': 'fadeInUp 1s ease-out forwards',
      },
    },
  },
  plugins: [],
}
export default config;
