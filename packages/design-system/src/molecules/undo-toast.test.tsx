import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { act } from 'react'
import { expect, test, vi } from 'vitest'

import { Toaster } from '@portflow/design-system/atoms/sonner'
import { showUndoToast } from '@portflow/design-system/molecules/undo-toast'

test('the undo toast says what was done and undoes it', async () => {
  const onUndo = vi.fn<() => void>()
  render(<Toaster />)

  act(() => {
    showUndoToast({ message: 'Weighing deleted', undoLabel: 'Undo', onUndo })
  })

  expect(await screen.findByText('Weighing deleted')).toBeVisible()
  await userEvent.click(screen.getByRole('button', { name: 'Undo' }))
  expect(onUndo).toHaveBeenCalledOnce()
})
