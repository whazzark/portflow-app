import type { Meta, StoryObj } from '@storybook/react-vite'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@portflow/design-system/atoms/tabs'

const meta = {
  title: 'Atoms/Tabs',
  component: Tabs,
} satisfies Meta<typeof Tabs>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <Tabs defaultValue="holds" {...args}>
      <TabsList>
        <TabsTrigger value="holds">Holds</TabsTrigger>
        <TabsTrigger value="weighings">Weighings</TabsTrigger>
        <TabsTrigger value="stops">Stops</TabsTrigger>
      </TabsList>
      <TabsContent value="holds">Three holds.</TabsContent>
      <TabsContent value="weighings">Twelve weighings.</TabsContent>
      <TabsContent value="stops">No stop.</TabsContent>
    </Tabs>
  ),
}
