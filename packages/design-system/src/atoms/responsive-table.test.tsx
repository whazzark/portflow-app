import { render, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'

import {
  ResponsiveTable,
  ResponsiveTableBody,
  ResponsiveTableCaption,
  ResponsiveTableCell,
  ResponsiveTableHead,
  ResponsiveTableHeader,
  ResponsiveTableRow,
} from '@portflow/design-system/atoms/responsive-table'

test('a responsive table is a table, and each cell carries the name of its column', () => {
  render(
    <ResponsiveTable>
      <ResponsiveTableCaption>Weighings</ResponsiveTableCaption>
      <ResponsiveTableHeader>
        <ResponsiveTableRow>
          <ResponsiveTableHead>Truck</ResponsiveTableHead>
          <ResponsiveTableHead>Net</ResponsiveTableHead>
        </ResponsiveTableRow>
      </ResponsiveTableHeader>
      <ResponsiveTableBody>
        <ResponsiveTableRow>
          <ResponsiveTableCell label="Truck">AB-123-CD</ResponsiveTableCell>
          <ResponsiveTableCell label="Net">28.4 t</ResponsiveTableCell>
        </ResponsiveTableRow>
      </ResponsiveTableBody>
    </ResponsiveTable>,
  )

  const table = screen.getByRole('table', { name: 'Weighings' })
  expect(
    within(table)
      .getAllByRole('columnheader')
      .map((head) => head.textContent),
  ).toEqual(['Truck', 'Net'])
  expect(within(table).getByRole('cell', { name: '28.4 t' })).toHaveAttribute('data-label', 'Net')
})
