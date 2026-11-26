import type { StorybookConfig } from '@storybook/react-vite'

// The Vite config of the package (React, Tailwind, the alias of the package) applies.
const config: StorybookConfig = {
  stories: ['../src/**/*.stories.tsx'],
  addons: ['@storybook/addon-a11y'],
  framework: '@storybook/react-vite',
  core: { disableTelemetry: true },
}

export default config
