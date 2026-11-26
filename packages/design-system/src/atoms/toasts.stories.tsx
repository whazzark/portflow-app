import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from '@portflow/design-system/atoms/button'
import { Toaster } from '@portflow/design-system/atoms/sonner'
import {
  showErrorToast,
  showInfoToast,
  showSuccessToast,
  showUndoToast,
} from '@portflow/design-system/atoms/toasts'

const meta = {
  title: 'Atoms/Toasts',
  component: Toaster,
} satisfies Meta<typeof Toaster>

export default meta
type Story = StoryObj<typeof meta>

export const Outcomes: Story = {
  render: (args) => (
    <div className="flex flex-wrap gap-2">
      <Toaster {...args} />
      <Button onClick={() => showSuccessToast('Vessel announced')}>Show a success</Button>
      <Button
        variant="outline"
        onClick={() => showErrorToast('The service cannot be reached. Try again in a moment.')}
      >
        Show an error
      </Button>
      <Button variant="outline" onClick={() => showInfoToast('The weighbridge restarts at 14:00.')}>
        Show an information
      </Button>
    </div>
  ),
}

export const Undo: Story = {
  render: (args) => (
    <>
      <Toaster {...args} />
      <Button
        variant="destructive"
        onClick={() =>
          showUndoToast({ message: 'Weighing deleted', undoLabel: 'Undo', onUndo: () => {} })
        }
      >
        Delete the weighing
      </Button>
    </>
  ),
}
