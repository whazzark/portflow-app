import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { act } from 'react'
import { expect, test, vi } from 'vitest'

import { Toaster } from '@portflow/design-system/atoms/sonner'
import {
  showErrorToast,
  showInfoToast,
  showSuccessToast,
  showUndoToast,
} from '@portflow/design-system/atoms/toasts'

test('a success toast says what was done', async () => {
  render(<Toaster />)

  act(() => {
    showSuccessToast('Vessel announced')
  })

  expect(await screen.findByText('Vessel announced')).toBeVisible()
  expect(screen.getByText('Vessel announced').closest('[data-sonner-toast]')).toHaveAttribute(
    'data-type',
    'success',
  )
})

test('an error toast says what went wrong', async () => {
  render(<Toaster />)

  act(() => {
    showErrorToast('The service cannot be reached.')
  })

  expect(await screen.findByText('The service cannot be reached.')).toBeVisible()
  expect(
    screen.getByText('The service cannot be reached.').closest('[data-sonner-toast]'),
  ).toHaveAttribute('data-type', 'error')
})

test('an info toast gives a piece of information', async () => {
  render(<Toaster />)

  act(() => {
    showInfoToast('The weighbridge restarts at 14:00.')
  })

  expect(await screen.findByText('The weighbridge restarts at 14:00.')).toBeVisible()
  expect(
    screen.getByText('The weighbridge restarts at 14:00.').closest('[data-sonner-toast]'),
  ).toHaveAttribute('data-type', 'info')
})

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
