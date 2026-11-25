// The TypeScript types of the contract, generated from openapi.json (ADR 0003, 0016).
// The generation script writes them; the test compares them with the committed file.

import { readFile } from 'node:fs/promises'

import openapiTS, { astToString } from 'openapi-typescript'

export const CONTRACT_URL = new URL('../openapi.json', import.meta.url)
export const TYPES_URL = new URL('../generated/schema.d.ts', import.meta.url)

const HEADER = `// Generated from openapi.json by \`pnpm --filter @portflow/contracts generate\`.
// Do not edit: change the API, write the contract, then generate again.

`

export async function generateTypes(): Promise<string> {
  const contract = await readFile(CONTRACT_URL, 'utf8')
  const ast = await openapiTS(contract)
  return HEADER + astToString(ast)
}
