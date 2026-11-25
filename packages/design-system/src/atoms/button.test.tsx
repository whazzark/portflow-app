import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'

import { Button } from '@portflow/design-system/atoms/button'

test('a button is reached with Tab and pressed with Enter or Space', async () => {
  const onClick = vi.fn()
  render(<Button onClick={onClick}>Save</Button>)

  await userEvent.tab()
  expect(screen.getByRole('button', { name: 'Save' })).toHaveFocus()
  await userEvent.keyboard('{Enter}')
  await userEvent.keyboard(' ')
  expect(onClick).toHaveBeenCalledTimes(2)
})

test('a disabled button cannot be pressed', async () => {
  const onClick = vi.fn()
  render(
    <Button disabled onClick={onClick}>
      Save
    </Button>,
  )

  await userEvent.click(screen.getByRole('button', { name: 'Save' }))
  expect(onClick).not.toHaveBeenCalled()
})
