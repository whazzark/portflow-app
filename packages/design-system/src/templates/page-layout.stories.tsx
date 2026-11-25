import type { Meta, StoryObj } from '@storybook/react-vite'

import { PageLayout, PageLayoutTitle } from '@portflow/design-system/templates/page-layout'

const meta = {
  title: 'Templates/Page layout',
  component: PageLayout,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof PageLayout>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <PageLayout {...args}>
      <PageLayoutTitle>Service health</PageLayoutTitle>
      <p>One column, centred: the technical pages and the states of a route.</p>
    </PageLayout>
  ),
}
