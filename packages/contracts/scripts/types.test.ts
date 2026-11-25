import { readFile } from 'node:fs/promises'

import { expect, test } from 'vitest'

import { generateTypes, TYPES_URL } from './types.ts'

test('the committed types match the contract', async () => {
  const committed = await readFile(TYPES_URL, 'utf8')

  expect(
    committed === (await generateTypes()),
    'generated/schema.d.ts differs from openapi.json: run `pnpm --filter @portflow/contracts generate` and commit the result',
  ).toBe(true)
})
