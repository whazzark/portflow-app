import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button, PendingButton } from '@portflow/design-system/atoms/button'

const meta = {
  title: 'Atoms/Button',
  component: Button,
  args: { children: 'Save' },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-wrap gap-2">
      <Button {...args}>Primary</Button>
      <Button {...args} variant="secondary">
        Secondary
      </Button>
      <Button {...args} variant="outline">
        Outline
      </Button>
      <Button {...args} variant="ghost">
        Ghost
      </Button>
      <Button {...args} variant="destructive">
        Delete
      </Button>
      <Button {...args} variant="link">
        Link
      </Button>
      <Button {...args} disabled>
        Disabled
      </Button>
    </div>
  ),
}

export const Pending: Story = {
  render: (args) => (
    <div className="flex flex-wrap gap-2">
      <PendingButton {...args} pending={false}>
        Close the hold
      </PendingButton>
      <PendingButton {...args} pending>
        Close the hold
      </PendingButton>
    </div>
  ),
}
