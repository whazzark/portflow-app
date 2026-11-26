import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from '@portflow/design-system/atoms/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@portflow/design-system/atoms/tooltip'

const meta = {
  title: 'Atoms/Tooltip',
  component: Tooltip,
} satisfies Meta<typeof Tooltip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <Tooltip {...args}>
      <TooltipTrigger asChild>
        <Button variant="outline">Export</Button>
      </TooltipTrigger>
      <TooltipContent>Export the weighings as a spreadsheet</TooltipContent>
    </Tooltip>
  ),
}
