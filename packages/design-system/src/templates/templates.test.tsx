import { render, screen } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'

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

afterEach(() => {
  delete document.documentElement.dataset.density
})

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

test('the field layout sets the field density on the document while it is shown', () => {
  // Selects, dialogs and toasts render at the root of the document, outside the layout.
  document.documentElement.dataset.density = 'office'
  const { unmount } = render(
    <FieldLayout>
      <FieldLayoutContent>Form</FieldLayoutContent>
    </FieldLayout>,
  )

  expect(document.documentElement).toHaveAttribute('data-density', 'field')
  unmount()
  expect(document.documentElement).toHaveAttribute('data-density', 'office')
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

test('two field layouts shown together give the density back once both are gone', () => {
  document.documentElement.dataset.density = 'office'
  const { unmount } = render(
    <>
      <FieldLayout>One</FieldLayout>
      <FieldLayout>Two</FieldLayout>
    </>,
  )

  expect(document.documentElement).toHaveAttribute('data-density', 'field')
  unmount()
  expect(document.documentElement).toHaveAttribute('data-density', 'office')
})
