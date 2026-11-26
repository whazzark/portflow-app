import { render, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableRow,
} from '@portflow/design-system/atoms/table'

test('a table is named by its caption and its rows by their cells', () => {
  render(
    <Table>
      <TableCaption>Holds</TableCaption>
      <TableBody>
        <TableRow>
          <TableHead scope="row">Hold 1</TableHead>
          <TableCell>Open</TableCell>
        </TableRow>
      </TableBody>
    </Table>,
  )

  const table = screen.getByRole('table', { name: 'Holds' })
  expect(within(table).getByRole('row', { name: 'Hold 1 Open' })).toBeVisible()
})
