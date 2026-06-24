import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        // ✅ FIX: PageSpeed Insights flagged "Background and foreground
        // colours do not have a sufficient contrast ratio" on every
        // orange CTA button site-wide (bg-orange-500 + text-white =
        // only 2.80:1, fails WCAG AA's 4.5:1 minimum). Rather than edit
        // 10 separate files, this overrides Tailwind's default orange
        // palette so EVERY existing bg-orange-500 usage automatically
        // becomes accessible — orange-500 here measures 5.18:1 against
        // white (passes AA), with the rest of the scale shifted to
        // match so hover states (orange-600) still look correct and
        // visually consistent with the original brand orange.
        orange: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#c2410c',  // was #f97316 (2.80:1) — now passes AA at 5.18:1
          600: '#9a3412',  // darker hover state, still passes AA comfortably
          700: '#7c2d12',
          800: '#6c2e0f',
          900: '#451a03',
        },
        terracotta: {
          50: '#f6f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        charcoal: {
          50:  '#f4f4f7',
          100: '#e3e3e9',
          200: '#c8c8d3',
          300: '#a4a4b5',
          400: '#7c7c92',
          500: '#5a5a72',
          600: '#46465c',
          700: '#333345',
          800: '#232331',
          900: '#181824',
          950: '#0d0d16',
        },
        cream: {
        50:  '#FAFBFD', // ultra-light, almost white
        100: '#F5F6FA', // base nebula pearl
        200: '#EBEDF3',
        300: '#DDE0E8',
        400: '#C4C7D2',
        500: '#ACAFBB',
        600: '#8F92A0',
        700: '#717382',
        800: '#515262',
        900: '#343545',
        950: '#1B1C27',
        },
        gold: {
         50:  '#FAFBFD', // ultra-light, almost white
        100: '#F5F6FA', // base nebula pearl
        200: '#EBEDF3',
        300: '#DDE0E8',
        400: '#C4C7D2',
        500: '#ACAFBB',
        600: '#8F92A0',
        700: '#717382',
        800: '#515262',
        900: '#343545',
        950: '#1B1C27',
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate'), require('@tailwindcss/typography')],
};
export default config;




