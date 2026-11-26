import type { Meta, StoryObj } from '@storybook/react-vite'

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

const meta = {
  title: 'Molecules/States',
  component: LoadingState,
} satisfies Meta<typeof LoadingState>

export default meta
type Story = StoryObj<typeof meta>

export const Loading: Story = {
  render: (args) => (
    <LoadingState {...args}>
      <LoadingStateLabel>Loading…</LoadingStateLabel>
      <LoadingStatePlaceholder />
    </LoadingState>
  ),
}

export const Empty: Story = {
  render: () => (
    <EmptyState>
      <EmptyStateTitle>No vessel yet</EmptyStateTitle>
      <EmptyStateDescription>Vessels appear here once announced.</EmptyStateDescription>
      <EmptyStateActions>
        <Button>Announce a vessel</Button>
      </EmptyStateActions>
    </EmptyState>
  ),
}

export const Error: Story = {
  render: () => (
    <ErrorState>
      <ErrorStateMessage>The service cannot be reached. Try again in a moment.</ErrorStateMessage>
      <ErrorStateActions>
        <Button variant="outline">Try again</Button>
      </ErrorStateActions>
    </ErrorState>
  ),
}
