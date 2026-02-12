import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/App.tsx',
    './src/index.tsx',
    './src/components/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {}
  },
  plugins: []
};

export default config;
