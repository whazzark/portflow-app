import { render, screen, within } from '@testing-library/react'
import { act } from 'react'
import { toast } from 'sonner'
import { expect, test } from 'vitest'

import { Toaster } from '@portflow/design-system/atoms/sonner'
import {
  showErrorToast,
  showInfoToast,
  showSuccessToast,
  showUndoToast,
} from '@portflow/design-system/atoms/toasts'

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

test('a success, an error, a warning and an information are coloured', async () => {
  render(<Toaster />)

  act(() => {
    showSuccessToast('Vessel announced')
    showErrorToast('The weighing was refused')
    toast.warning('Hold almost full')
    showInfoToast('The weighbridge restarts at 14:00.')
  })

  for (const message of [
    'Vessel announced',
    'The weighing was refused',
    'Hold almost full',
    'The weighbridge restarts at 14:00.',
  ]) {
    expect((await screen.findByText(message)).closest('[data-sonner-toast]')).toHaveAttribute(
      'data-rich-colors',
      'true',
    )
  }
})

test('the colours of a coloured toast are those of the tokens of its state', async () => {
  render(<Toaster />)

  act(() => {
    showSuccessToast('Discharge started')
  })

  const list = (await screen.findByText('Discharge started')).closest<HTMLElement>(
    '[data-sonner-toaster]',
  )
  // Sonner names the text of a state as the tokens do (`--success-text`): the toaster
  // reads the token from its parent, under another name, before it takes the name back.
  const parent = list?.closest<HTMLElement>('[data-toaster-tokens]')
  for (const [state, token] of [
    ['success', 'success'],
    ['error', 'danger'],
    ['warning', 'warning'],
    ['info', 'info'],
  ] as const) {
    expect(list?.style.getPropertyValue(`--${state}-bg`)).toBe(`var(--${token})`)
    expect(list?.style.getPropertyValue(`--${state}-border`)).toBe(`var(--${token})`)
    expect(list?.style.getPropertyValue(`--${state}-text`)).toBe(`var(--toaster-${token}-text)`)
    expect(parent?.style.getPropertyValue(`--toaster-${token}-text`)).toBe(`var(--${token}-text)`)
  }
})

test('the action and the close button of a toast keep the focus ring', async () => {
  render(<Toaster closeButton />)

  act(() => {
    showUndoToast({ message: 'Berth released', undoLabel: 'Undo', onUndo: () => {} })
  })

  const item = (await screen.findByText('Berth released')).closest<HTMLElement>(
    '[data-sonner-toast]',
  )
  expect(item).not.toBeNull()
  const toastItem = within(item ?? document.body)
  expect(toastItem.getByRole('button', { name: 'Undo' })).toHaveClass('focus-visible:ring-ring!')
  expect(toastItem.getByRole('button', { name: 'Close toast' })).toHaveClass(
    'focus-visible:ring-ring!',
  )
})
