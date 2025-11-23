import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  "stories": [
    "./stories/**/*.mdx",
    "./stories/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@chromatic-com/storybook",
    "@storybook/addon-docs",
    "@storybook/addon-onboarding",
    "@storybook/addon-a11y"
  ],
  "framework": {
    "name": "@storybook/react-vite",
    "options": {}
  },
  "typescript": {
    "check": false,
    "reactDocgen": false
  },
  async viteFinal(config) {
    // Ensure React is available globally
    config.define = {
      ...config.define,
      'process.env': {},
    };
    
    // Configure esbuild for JSX
    config.esbuild = {
      ...config.esbuild,
      jsx: 'automatic',
      jsxImportSource: 'react',
    };
    
    return config;
  },
};
export default config;