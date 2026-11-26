import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'

import { PendingButton } from '@portflow/design-system/molecules/pending-button'

test('a pending button cannot be pressed, says it is busy and keeps its name', () => {
  render(<PendingButton pending>Save</PendingButton>)

  const button = screen.getByRole('button', { name: 'Save' })
  expect(button).toBeDisabled()
  expect(button).toHaveAttribute('aria-busy', 'true')
})

test('a button that is not pending can be pressed and is not busy', () => {
  render(<PendingButton pending={false}>Save</PendingButton>)

  const button = screen.getByRole('button', { name: 'Save' })
  expect(button).toBeEnabled()
  expect(button).not.toHaveAttribute('aria-busy')
})

test('a button disabled for another reason stays disabled when it is not pending', () => {
  render(
    <PendingButton pending={false} disabled>
      Save
    </PendingButton>,
  )

  expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
})
