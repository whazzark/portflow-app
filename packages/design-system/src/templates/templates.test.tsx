import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'

import {
  FieldLayout,
  FieldLayoutActions,
  FieldLayoutContent,
  FieldLayoutHeader,
  FieldLayoutTitle,
} from '@portflow/design-system/templates/field-layout'
import {
  OfficeLayout,
  OfficeLayoutContent,
  OfficeLayoutNav,
  OfficeLayoutNavItem,
  OfficeLayoutNavList,
} from '@portflow/design-system/templates/office-layout'
import { PageLayout, PageLayoutTitle } from '@portflow/design-system/templates/page-layout'

test('the office layout has a named navigation and a main content', () => {
  render(
    <OfficeLayout>
      <OfficeLayoutNav aria-label="Sections">
        <OfficeLayoutNavList>
          <OfficeLayoutNavItem>
            <a href="/vessels">Vessels</a>
          </OfficeLayoutNavItem>
        </OfficeLayoutNavList>
      </OfficeLayoutNav>
      <OfficeLayoutContent>Content</OfficeLayoutContent>
    </OfficeLayout>,
  )

  expect(screen.getByRole('navigation', { name: 'Sections' })).toContainElement(
    screen.getByRole('link', { name: 'Vessels' }),
  )
  expect(screen.getByRole('main')).toHaveTextContent('Content')
})

test('the field layout has the task as its heading and sets the field density', () => {
  const { container } = render(
    <FieldLayout>
      <FieldLayoutHeader>
        <FieldLayoutTitle>Record a weighing</FieldLayoutTitle>
      </FieldLayoutHeader>
      <FieldLayoutContent>Form</FieldLayoutContent>
      <FieldLayoutActions>
        <button type="button">Save</button>
      </FieldLayoutActions>
    </FieldLayout>,
  )

  expect(screen.getByRole('heading', { level: 1, name: 'Record a weighing' })).toBeVisible()
  expect(screen.getByRole('main')).toHaveTextContent('Form')
  expect(container.firstElementChild).toHaveAttribute('data-density', 'field')
})

test('the page layout is the main content with its heading', () => {
  render(
    <PageLayout>
      <PageLayoutTitle>Service health</PageLayoutTitle>
    </PageLayout>,
  )

  expect(screen.getByRole('main')).toContainElement(
    screen.getByRole('heading', { level: 1, name: 'Service health' }),
  )
})
