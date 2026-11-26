import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'

import { Input } from '@portflow/design-system/atoms/input'
import { Label } from '@portflow/design-system/atoms/label'

test('an input is named by its label and typed into', async () => {
  render(
    <>
      <Label htmlFor="vessel">Vessel</Label>
      <Input id="vessel" />
    </>,
  )

  await userEvent.click(screen.getByText('Vessel'))
  await userEvent.keyboard('Atlantic Star')
  expect(screen.getByRole('textbox', { name: 'Vessel' })).toHaveValue('Atlantic Star')
})
