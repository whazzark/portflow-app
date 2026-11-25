import { setupServer } from 'msw/node'

/** The network of the tests: each test declares the answers it needs with `server.use`. */
export const server = setupServer()
