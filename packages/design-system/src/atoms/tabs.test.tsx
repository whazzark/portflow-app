import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@portflow/design-system/atoms/tabs'

test('tabs are moved between with the arrow keys', async () => {
  render(
    <Tabs defaultValue="holds">
      <TabsList>
        <TabsTrigger value="holds">Holds</TabsTrigger>
        <TabsTrigger value="weighings">Weighings</TabsTrigger>
      </TabsList>
      <TabsContent value="holds">Three holds</TabsContent>
      <TabsContent value="weighings">Twelve weighings</TabsContent>
    </Tabs>,
  )

  await userEvent.tab()
  expect(screen.getByRole('tab', { name: 'Holds' })).toHaveFocus()
  await userEvent.keyboard('{ArrowRight}')
  expect(screen.getByRole('tab', { name: 'Weighings', selected: true })).toHaveFocus()
  expect(screen.getByRole('tabpanel', { name: 'Weighings' })).toHaveTextContent('Twelve weighings')
})
