import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'

import { Checkbox } from '@portflow/design-system/atoms/checkbox'
import { Label } from '@portflow/design-system/atoms/label'

test('a checkbox is named by its label and toggled with Space', async () => {
  render(
    <Label>
      <Checkbox /> Night shift
    </Label>,
  )

  const checkbox = screen.getByRole('checkbox', { name: 'Night shift' })
  await userEvent.tab()
  expect(checkbox).toHaveFocus()
  await userEvent.keyboard(' ')
  expect(checkbox).toBeChecked()
})
