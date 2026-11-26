import { render, screen } from '@testing-library/react'
import { act } from 'react'
import { expect, test } from 'vitest'

import { Toaster } from '@portflow/design-system/atoms/sonner'
import { showUndoToast } from '@portflow/design-system/atoms/toasts'

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
