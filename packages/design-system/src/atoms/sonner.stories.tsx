import type { Meta, StoryObj } from '@storybook/react-vite'
import { toast } from 'sonner'

import { Button } from '@portflow/design-system/atoms/button'
import { Toaster } from '@portflow/design-system/atoms/sonner'

const meta = {
  title: 'Atoms/Toast',
  component: Toaster,
} satisfies Meta<typeof Toaster>

export default meta
type Story = StoryObj<typeof meta>

export const Kinds: Story = {
  render: (args) => (
    <div className="flex flex-wrap gap-2">
      <Toaster {...args} />
      <Button variant="outline" onClick={() => toast('Vessel announced')}>
        Neutral
      </Button>
      <Button variant="outline" onClick={() => toast.success('Weighing recorded')}>
        Success
      </Button>
      <Button variant="outline" onClick={() => toast.warning('Hold almost full')}>
        Warning
      </Button>
      <Button variant="outline" onClick={() => toast.error('The weighing was refused')}>
        Error
      </Button>
    </div>
  ),
}
