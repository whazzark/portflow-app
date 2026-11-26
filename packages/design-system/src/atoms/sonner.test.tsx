import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { act } from 'react'
import { expect, test, vi } from 'vitest'

import {
  showErrorToast,
  showSuccessToast,
  showUndoToast,
  Toaster,
} from '@portflow/design-system/atoms/sonner'

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

test('options given to the toaster keep the classes of its toasts and of their action', async () => {
  render(<Toaster toastOptions={{ duration: 60_000 }} />)

  act(() => {
    showUndoToast({ message: 'Hold closed', undoLabel: 'Undo', onUndo: () => {} })
  })

  expect(await screen.findByRole('button', { name: 'Undo' })).toHaveClass('h-control!')
  expect(screen.getByText('Hold closed').closest('[data-sonner-toast]')).toHaveClass(
    'focus-visible:ring-ring!',
  )
})

test('a style given to the toaster keeps the colours of the tokens', async () => {
  render(<Toaster style={{ zIndex: 50 }} />)

  act(() => {
    showUndoToast({ message: 'Hold closed', undoLabel: 'Undo', onUndo: () => {} })
  })

  // Sonner renders its list once a toast is shown.
  const list = (await screen.findByText('Hold closed')).closest<HTMLElement>(
    '[data-sonner-toaster]',
  )
  expect(list?.style.getPropertyValue('--normal-bg')).toBe('var(--surface)')
  expect(list?.style.zIndex).toBe('50')
})
