import type { Meta, StoryObj } from '@storybook/react-vite'

import { Badge } from '@portflow/design-system/atoms/badge'

const meta = {
  title: 'Atoms/Badge',
  component: Badge,
  args: { children: 'Open' },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-wrap gap-2">
      <Badge {...args}>Open</Badge>
      <Badge {...args} variant="secondary">
        Planned
      </Badge>
      <Badge {...args} variant="destructive">
        Refused
      </Badge>
      <Badge {...args} variant="outline">
        Closed
      </Badge>
    </div>
  ),
}
