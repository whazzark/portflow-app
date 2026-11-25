import type { Meta, StoryObj } from '@storybook/react-vite'

import { Skeleton } from '@portflow/design-system/atoms/skeleton'

const meta = {
  title: 'Atoms/Skeleton',
  component: Skeleton,
} satisfies Meta<typeof Skeleton>

export default meta
type Story = StoryObj<typeof meta>

export const Lines: Story = {
  render: (args) => (
    <div className="flex max-w-sm flex-col gap-2">
      <Skeleton className="h-control w-full" {...args} />
      <Skeleton className="h-control w-2/3" {...args} />
    </div>
  ),
}
