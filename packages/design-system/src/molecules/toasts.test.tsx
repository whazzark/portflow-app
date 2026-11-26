import { render, screen } from '@testing-library/react'
import { act } from 'react'
import { expect, test } from 'vitest'

import { Toaster } from '@portflow/design-system/atoms/sonner'
import { showErrorToast, showSuccessToast } from '@portflow/design-system/molecules/toasts'

test('a success toast says what was done', async () => {
  render(<Toaster />)

  act(() => {
    showSuccessToast('Vessel announced')
  })

  expect(await screen.findByText('Vessel announced')).toBeVisible()
  expect(
    screen.getByText('Vessel announced').closest('[data-sonner-toast]'),
  ).toHaveAttribute('data-type', 'success')
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
