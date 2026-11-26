import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'

import { Button } from '@portflow/design-system/atoms/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@portflow/design-system/atoms/dialog'

test('a dialog opens from the keyboard, is named by its title, and closes with Escape', async () => {
  render(
    <Dialog>
      <DialogTrigger asChild>
        <Button>Close the hold</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Close hold 3</DialogTitle>
        <DialogDescription>No more weighings can be recorded on it.</DialogDescription>
      </DialogContent>
    </Dialog>,
  )

  await userEvent.tab()
  await userEvent.keyboard('{Enter}')
  expect(screen.getByRole('dialog', { name: 'Close hold 3' })).toBeVisible()
  expect(screen.getByRole('button', { name: 'Close' })).toBeVisible()

  await userEvent.keyboard('{Escape}')
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Close the hold' })).toHaveFocus()
})
