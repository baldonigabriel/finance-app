import type { Config } from 'tailwindcss';

export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-ibm-plex-sans)', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          blue: '#2563EB',
          'blue-light': '#EFF6FF',
        },
      },
      backgroundColor: {
        page: '#F8F7F4',
      },
    },
  },
  plugins: [],
} satisfies Config;
