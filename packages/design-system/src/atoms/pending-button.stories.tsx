import type { Meta, StoryObj } from '@storybook/react-vite'

import { PendingButton } from '@portflow/design-system/atoms/pending-button'

const meta = {
  title: 'Atoms/Pending button',
  component: PendingButton,
  args: { children: 'Close the hold', pending: false },
} satisfies Meta<typeof PendingButton>

export default meta
type Story = StoryObj<typeof meta>

export const Idle: Story = {}

export const Pending: Story = { args: { pending: true } }
