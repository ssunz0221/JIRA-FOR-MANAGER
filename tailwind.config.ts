import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        jira: {
          blue: '#0052CC',
          light: '#DEEBFF',
          dark: '#091E42',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
