import type { Meta, StoryObj } from '@storybook/react-vite'

import { Input } from '@portflow/design-system/atoms/input'
import { Label } from '@portflow/design-system/atoms/label'

const meta = {
  title: 'Atoms/Input',
  component: Input,
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const WithLabel: Story = {
  render: (args) => (
    <div className="flex max-w-sm flex-col gap-2">
      <Label htmlFor="vessel">Vessel</Label>
      <Input id="vessel" placeholder="Name of the vessel" {...args} />
    </div>
  ),
}

export const Invalid: Story = {
  render: (args) => (
    <div className="flex max-w-sm flex-col gap-2">
      <Label htmlFor="weight">Gross weight</Label>
      <Input id="weight" aria-invalid defaultValue="-3" {...args} />
    </div>
  ),
}
