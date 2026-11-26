import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'

import { Button, PendingButton } from '@portflow/design-system/atoms/button'

test('a button is reached with Tab and pressed with Enter or Space', async () => {
  const onClick = vi.fn<() => void>()
  render(<Button onClick={onClick}>Save</Button>)

  await userEvent.tab()
  expect(screen.getByRole('button', { name: 'Save' })).toHaveFocus()
  await userEvent.keyboard('{Enter}')
  await userEvent.keyboard(' ')
  expect(onClick).toHaveBeenCalledTimes(2)
})

test('a disabled button cannot be pressed', async () => {
  const onClick = vi.fn<() => void>()
  render(
    <Button disabled onClick={onClick}>
      Save
    </Button>,
  )

  await userEvent.click(screen.getByRole('button', { name: 'Save' }))
  expect(onClick).not.toHaveBeenCalled()
})

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
