import type { Preview } from '@storybook/react-vite';
import '../src/client/Main.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#0f172a' },
      ],
    },
    a11y: {
      test: 'todo'
    },
    layout: 'padded',
  },
};

export default preview;