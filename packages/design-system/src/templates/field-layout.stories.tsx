import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from '@portflow/design-system/atoms/button'
import { Input } from '@portflow/design-system/atoms/input'
import { Label } from '@portflow/design-system/atoms/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@portflow/design-system/atoms/select'
import {
  FieldLayout,
  FieldLayoutActions,
  FieldLayoutContent,
  FieldLayoutHeader,
  FieldLayoutTitle,
} from '@portflow/design-system/templates/field-layout'

const meta = {
  title: 'Templates/Field layout',
  component: FieldLayout,
  parameters: { layout: 'fullscreen' },
  // The template sets the field density itself; the toolbar shows the same.
  globals: { density: 'field' },
} satisfies Meta<typeof FieldLayout>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <FieldLayout {...args}>
      <FieldLayoutHeader>
        <FieldLayoutTitle>Record a weighing</FieldLayoutTitle>
      </FieldLayoutHeader>
      <FieldLayoutContent>
        <div className="flex flex-col gap-2">
          <Label htmlFor="truck">Truck</Label>
          <Input id="truck" placeholder="Registration" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="hold">Hold</Label>
          <Select>
            <SelectTrigger id="hold" className="w-full">
              <SelectValue placeholder="Choose a hold" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Hold 1</SelectItem>
              <SelectItem value="2">Hold 2</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="gross">Gross weight (t)</Label>
          <Input id="gross" inputMode="decimal" />
        </div>
      </FieldLayoutContent>
      <FieldLayoutActions>
        <Button variant="outline">Cancel</Button>
        <Button>Record</Button>
      </FieldLayoutActions>
    </FieldLayout>
  ),
}
