import type { Meta, StoryObj } from '@storybook/react-vite'

import { Label } from '@portflow/design-system/atoms/label'

const meta = {
  title: 'Atoms/Label',
  component: Label,
  args: { children: 'Berth' },
} satisfies Meta<typeof Label>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
