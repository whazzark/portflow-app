import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from '@portflow/design-system/atoms/button'
import { Toaster } from '@portflow/design-system/atoms/sonner'
import { showUndoToast } from '@portflow/design-system/molecules/undo-toast'

const meta = {
  title: 'Molecules/Undo toast',
  component: Toaster,
} satisfies Meta<typeof Toaster>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
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
