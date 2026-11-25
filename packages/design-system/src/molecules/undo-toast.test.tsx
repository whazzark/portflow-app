import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { act } from 'react'
import { expect, test, vi } from 'vitest'

import { Toaster } from '@portflow/design-system/atoms/sonner'
import { showUndoToast } from '@portflow/design-system/molecules/undo-toast'

test('the undo toast says what was done and is undone with the keyboard', async () => {
  const onUndo = vi.fn<() => void>()
  render(<Toaster />)

  act(() => {
    showUndoToast({ message: 'Weighing deleted', undoLabel: 'Undo', onUndo })
  })

  expect(await screen.findByText('Weighing deleted')).toBeVisible()
  // The first Tab reaches the toast itself, the second its action.
  await userEvent.tab()
  await userEvent.tab()
  expect(screen.getByRole('button', { name: 'Undo' })).toHaveFocus()
  await userEvent.keyboard('{Enter}')
  expect(onUndo).toHaveBeenCalledOnce()
})
