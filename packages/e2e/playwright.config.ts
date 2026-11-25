import { defineConfig, devices } from '@playwright/test'

import {
  API_URL,
  DESKTOP_VIEWPORT,
  HEALTH_PATH,
  PHONE_VIEWPORT,
  REPOSITORY_ROOT,
  STORYBOOK_PORT,
  STORYBOOK_URL,
  WEB_PORT,
  WEB_URL,
} from './constants.ts'

const CI = Boolean(process.env.CI)

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  reporter: CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: WEB_URL,
    trace: 'retain-on-failure',
  },
  // Every screen is tested at a phone width and at a desktop width (.claude/rules/testing.md).
  projects: [
    {
      name: 'phone',
      use: {
        ...devices['Desktop Chrome'],
        viewport: PHONE_VIEWPORT,
        isMobile: true,
        hasTouch: true,
      },
    },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: DESKTOP_VIEWPORT } },
  ],
  // The whole application: the API on PostgreSQL, then the built web app under the same
  // origin; and the Storybook of the design system. The suite always starts its own: a
  // server already listening is never reused, since Playwright would take any answer,
  // even another program's, as a ready server.
  webServer: [
    {
      command: 'pnpm --filter @portflow/api migrate && pnpm --filter @portflow/api start',
      cwd: REPOSITORY_ROOT,
      url: `${API_URL}${HEALTH_PATH}`,
      reuseExistingServer: false,
      timeout: 180_000,
      stdout: 'pipe',
    },
    {
      command: `pnpm --filter @portflow/web preview --host 127.0.0.1 --port ${WEB_PORT} --strictPort`,
      cwd: REPOSITORY_ROOT,
      url: WEB_URL,
      reuseExistingServer: false,
      timeout: 60_000,
    },
    // The built Storybook of the design system (ADR 0019): its templates and showcase.
    {
      command: `pnpm --filter @portflow/design-system exec vite preview --outDir storybook-static --host 127.0.0.1 --port ${STORYBOOK_PORT} --strictPort`,
      cwd: REPOSITORY_ROOT,
      url: STORYBOOK_URL,
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
})
