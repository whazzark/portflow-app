import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from '@portflow/design-system/atoms/button'
import { Toaster } from '@portflow/design-system/atoms/sonner'
import { showErrorToast, showSuccessToast } from '@portflow/design-system/molecules/toasts'

const meta = {
  title: 'Molecules/Toasts',
  component: Toaster,
} satisfies Meta<typeof Toaster>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
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
    </div>
  ),
}
