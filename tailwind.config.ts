import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        table: {
          felt: '#1A4D2E',
          dark: '#0D3320',
          light: '#237A4B',
          shadow: '#0A2816',
        },
        panel: {
          DEFAULT: '#1A1A22',
          light: '#252530',
        },
        base: '#0E0E12',
        hwatu: {
          red: '#CC0000',
          blue: '#1A3C8F',
          green: '#2D5A27',
          gold: '#DAA520',
          back: '#1A1A1A',
          border: '#8B0000',
          face: '#F5F0E0',
        },
        gold: {
          DEFAULT: '#D4A84B',
          light: '#E8C66A',
          dark: '#A67C2E',
        },
        action: {
          blue: '#4A9FD9',
          'blue-hover': '#5BB3ED',
          danger: '#D94040',
          success: '#3DAD5C',
          muted: '#6B6B7B',
        },
        text: {
          primary: '#F0EBE0',
          secondary: '#A09682',
          muted: '#6B6260',
          'on-gold': '#1C1710',
        },
      },
      fontFamily: {
        sans: ['Pretendard Variable', 'Pretendard', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 6px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.3)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.3)',
        'card-selected': '0 6px 16px rgba(0,0,0,0.5), 0 0 0 2px #D4A84B, 0 0 12px rgba(212,168,75,0.3)',
        'panel': '0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)',
        'gold-glow': '0 0 16px rgba(212,168,75,0.25), 0 0 40px rgba(212,168,75,0.1)',
      },
    },
  },
  plugins: [],
};
export default config;
