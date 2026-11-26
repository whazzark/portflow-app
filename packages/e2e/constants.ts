import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/** The root of the repository: the servers start from it, and `.env` lives there. */
export const REPOSITORY_ROOT = fileURLToPath(new URL('../..', import.meta.url))

// The variables come from the environment, or from `.env` on a developer's machine.
const ENV_FILE = `${REPOSITORY_ROOT}.env`
if (existsSync(ENV_FILE)) process.loadEnvFile(ENV_FILE)

/** The API, with its scheme (`API_URL` of `.env.example`). */
export const API_URL = process.env.API_URL ?? 'http://127.0.0.1:8080'

/** The port of `vite preview`, which serves the built web app and forwards `/api` to the API. */
export const WEB_PORT = 4173
export const WEB_URL = `http://127.0.0.1:${WEB_PORT}`

/** The port of the built Storybook of the design system, served by `vite preview`. */
export const STORYBOOK_PORT = 6007
export const STORYBOOK_URL = `http://127.0.0.1:${STORYBOOK_PORT}`

/** The endpoint that answers once the API and its database are up. */
export const HEALTH_PATH = '/api/health'

/** A phone, below the `sm` breakpoint of Tailwind (640px), in portrait. */
export const PHONE_VIEWPORT = { width: 390, height: 844 }

/** A desktop, above the `lg` breakpoint of Tailwind (1024px). */
export const DESKTOP_VIEWPORT = { width: 1280, height: 800 }
