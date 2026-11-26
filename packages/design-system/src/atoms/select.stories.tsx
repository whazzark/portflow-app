import type { Meta, StoryObj } from '@storybook/react-vite'

import { Label } from '@portflow/design-system/atoms/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@portflow/design-system/atoms/select'

const meta = {
  title: 'Atoms/Select',
  component: Select,
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

export const WithLabel: Story = {
  render: (args) => (
    <div className="flex max-w-sm flex-col gap-2">
      <Label htmlFor="berth">Berth</Label>
      <Select {...args}>
        <SelectTrigger id="berth" className="w-full">
          <SelectValue placeholder="Choose a berth" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="north">North quay</SelectItem>
          <SelectItem value="south">South quay</SelectItem>
          <SelectItem value="east">East quay</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
}
