// Writes generated/schema.d.ts from openapi.json: `pnpm --filter @portflow/contracts generate`.

import { writeFile } from 'node:fs/promises'

import { generateTypes, TYPES_URL } from './types.ts'

await writeFile(TYPES_URL, await generateTypes())
