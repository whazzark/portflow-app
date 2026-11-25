import type { Meta, StoryObj } from '@storybook/react-vite'

import { Checkbox } from '@portflow/design-system/atoms/checkbox'
import { Label } from '@portflow/design-system/atoms/label'

const meta = {
  title: 'Atoms/Checkbox',
  component: Checkbox,
} satisfies Meta<typeof Checkbox>

export default meta
type Story = StoryObj<typeof meta>

export const WithLabel: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <Label>
        <Checkbox {...args} /> Night shift
      </Label>
      <Label>
        <Checkbox defaultChecked {...args} /> Rain stop
      </Label>
      <Label>
        <Checkbox disabled {...args} /> Closed hold
      </Label>
    </div>
  ),
}
