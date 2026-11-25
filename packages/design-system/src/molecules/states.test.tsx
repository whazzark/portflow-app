import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'

import { Button } from '@portflow/design-system/atoms/button'
import {
  EmptyState,
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateTitle,
} from '@portflow/design-system/molecules/empty-state'
import {
  ErrorState,
  ErrorStateActions,
  ErrorStateMessage,
} from '@portflow/design-system/molecules/error-state'
import {
  LoadingState,
  LoadingStateLabel,
  LoadingStatePlaceholder,
} from '@portflow/design-system/molecules/loading-state'

test('the loading state is a status that reads its label only', () => {
  render(
    <LoadingState>
      <LoadingStateLabel>Loading…</LoadingStateLabel>
      <LoadingStatePlaceholder />
    </LoadingState>,
  )

  expect(screen.getByRole('status')).toHaveTextContent(/^Loading…$/)
})

test('the error state is an alert whose retry is reached with the keyboard', async () => {
  const retry = vi.fn<() => void>()
  render(
    <ErrorState>
      <ErrorStateMessage>The service cannot be reached.</ErrorStateMessage>
      <ErrorStateActions>
        <Button onClick={retry}>Try again</Button>
      </ErrorStateActions>
    </ErrorState>,
  )

  expect(screen.getByRole('alert')).toHaveTextContent('The service cannot be reached.')
  await userEvent.tab()
  await userEvent.keyboard('{Enter}')
  expect(retry).toHaveBeenCalledOnce()
})

test('the empty state names what is missing and offers its action', () => {
  render(
    <EmptyState aria-labelledby="empty-title">
      <EmptyStateTitle id="empty-title">No vessel yet</EmptyStateTitle>
      <EmptyStateDescription>Vessels appear here once announced.</EmptyStateDescription>
      <EmptyStateActions>
        <Button>Announce a vessel</Button>
      </EmptyStateActions>
    </EmptyState>,
  )

  expect(screen.getByRole('region', { name: 'No vessel yet' })).toBeVisible()
  expect(screen.getByRole('heading', { name: 'No vessel yet' })).toBeVisible()
  expect(screen.getByRole('button', { name: 'Announce a vessel' })).toBeVisible()
})
