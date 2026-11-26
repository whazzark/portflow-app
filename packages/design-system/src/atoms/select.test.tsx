import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'

import { Label } from '@portflow/design-system/atoms/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@portflow/design-system/atoms/select'

test('a select is opened and an option chosen with the keyboard', async () => {
  render(
    <>
      <Label htmlFor="berth">Berth</Label>
      <Select>
        <SelectTrigger id="berth">
          <SelectValue placeholder="Choose a berth" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="north">North quay</SelectItem>
          <SelectItem value="south">South quay</SelectItem>
        </SelectContent>
      </Select>
    </>,
  )

  const trigger = screen.getByRole('combobox', { name: 'Berth' })
  await userEvent.tab()
  expect(trigger).toHaveFocus()
  await userEvent.keyboard('{Enter}')
  expect(screen.getByRole('listbox')).toBeVisible()
  await userEvent.keyboard('{ArrowDown}{Enter}')
  expect(trigger).toHaveTextContent('South quay')
})
