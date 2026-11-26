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
      <Button variant="outline" onClick={() => toast.info('The weighbridge restarts at 14:00.')}>
        Information
      </Button>
    </div>
  ),
}

/** Every kind at once, with a description, an action and the close button: the colours
 * of each state, its action and the focus rings on its fill. */
export const KindsWithActionAndClose: Story = {
  args: { closeButton: true, expand: true, visibleToasts: 5, toastOptions: { duration: Infinity } },
  render: (args) => (
    <>
      <Toaster {...args} />
      <Button
        variant="outline"
        onClick={() => {
          const action = { label: 'Open', onClick: () => {} }
          const description = 'Hold 3 of the vessel'
          toast('Vessel announced', { action, description })
          toast.success('Weighing recorded', { action, description })
          toast.warning('Hold almost full', { action, description })
          toast.error('The weighing was refused', { action, description })
          toast.info('The weighbridge restarts at 14:00.', { action, description })
        }}
      >
        Show every kind
      </Button>
    </>
  ),
}
