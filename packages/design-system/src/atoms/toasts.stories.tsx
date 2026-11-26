import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from '@portflow/design-system/atoms/button'
import { Toaster } from '@portflow/design-system/atoms/sonner'
import {
  showErrorToast,
  showInfoToast,
  showNeutralToast,
  showSuccessToast,
  showUndoToast,
  showWarningToast,
} from '@portflow/design-system/atoms/toasts'

const meta = {
  title: 'Atoms/Toasts',
  component: Toaster,
} satisfies Meta<typeof Toaster>

export default meta
type Story = StoryObj<typeof meta>

function showUndo() {
  showUndoToast({ message: 'Weighing deleted', undoLabel: 'Undo', onUndo: () => {} })
}

/** The six helpers side by side: switch the theme and the density in the toolbar. */
export const EveryHelper: Story = {
  args: { expand: true, visibleToasts: 6, toastOptions: { duration: Infinity } },
  render: (args) => (
    <div className="flex flex-wrap gap-2">
      <Toaster {...args} />
      <Button
        onClick={() => {
          showNeutralToast('Export started')
          showUndo()
          showSuccessToast('Vessel announced')
          showInfoToast('The weighbridge restarts at 14:00.')
          showWarningToast('Hold 2 is almost full.')
          showErrorToast('The service cannot be reached. Try again in a moment.')
        }}
      >
        Show all six
      </Button>
    </div>
  ),
}

export const Outcomes: Story = {
  render: (args) => (
    <div className="flex flex-wrap gap-2">
      <Toaster {...args} />
      <Button variant="outline" onClick={() => showNeutralToast('Export started')}>
        Show a neutral toast
      </Button>
      <Button onClick={() => showSuccessToast('Vessel announced')}>Show a success</Button>
      <Button variant="outline" onClick={() => showInfoToast('The weighbridge restarts at 14:00.')}>
        Show an information
      </Button>
      <Button variant="outline" onClick={() => showWarningToast('Hold 2 is almost full.')}>
        Show a warning
      </Button>
      <Button
        variant="outline"
        onClick={() => showErrorToast('The service cannot be reached. Try again in a moment.')}
      >
        Show an error
      </Button>
    </div>
  ),
}

export const Undo: Story = {
  render: (args) => (
    <>
      <Toaster {...args} />
      <Button variant="destructive" onClick={showUndo}>
        Delete the weighing
      </Button>
    </>
  ),
}
