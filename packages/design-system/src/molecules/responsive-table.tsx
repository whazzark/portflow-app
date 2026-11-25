import type { ComponentProps } from 'react'

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@portflow/design-system/atoms/table'
import { cn } from '@portflow/design-system/lib/utils'

/*
 * A dense table that becomes one card per row below `md`: the table atom, with only
 * the CSS changing at narrow widths. The header row is visually hidden there and each
 * cell shows its column name (`label`) before its value instead. Changing how a table
 * is displayed makes some browsers drop its semantics: each part declares its role,
 * on the element that already has it, so the lint rule that prefers tags is off here.
 */
/* oxlint-disable jsx-a11y/prefer-tag-over-role */

export function ResponsiveTable({ className, ...props }: ComponentProps<'table'>) {
  return <Table role="table" className={cn('max-md:block', className)} {...props} />
}

export function ResponsiveTableCaption({ className, ...props }: ComponentProps<'caption'>) {
  return (
    <TableCaption
      className={cn('text-left max-md:mt-0 max-md:mb-3 max-md:block', className)}
      {...props}
    />
  )
}

export function ResponsiveTableHeader({ className, ...props }: ComponentProps<'thead'>) {
  return <TableHeader role="rowgroup" className={cn('max-md:sr-only', className)} {...props} />
}

export function ResponsiveTableBody({ className, ...props }: ComponentProps<'tbody'>) {
  return (
    <TableBody
      role="rowgroup"
      className={cn(
        'max-md:flex max-md:flex-col max-md:gap-3 max-md:[&_tr:last-child]:border',
        className,
      )}
      {...props}
    />
  )
}

export function ResponsiveTableRow({ className, ...props }: ComponentProps<'tr'>) {
  return (
    <TableRow
      role="row"
      className={cn(
        'max-md:flex max-md:flex-col max-md:gap-1 max-md:rounded-lg max-md:border max-md:p-3',
        className,
      )}
      {...props}
    />
  )
}

export function ResponsiveTableHead({ className, ...props }: ComponentProps<'th'>) {
  return <TableHead role="columnheader" className={className} {...props} />
}

type ResponsiveTableCellProps = ComponentProps<'td'> & {
  /** The name of the column, shown before the value when the row is a card. */
  label: string
}

export function ResponsiveTableCell({ label, className, ...props }: ResponsiveTableCellProps) {
  return (
    <TableCell
      role="cell"
      data-label={label}
      className={cn(
        'max-md:flex max-md:justify-between max-md:gap-4 max-md:px-0 max-md:whitespace-normal max-md:before:font-medium max-md:before:text-text-muted max-md:before:content-[attr(data-label)]',
        className,
      )}
      {...props}
    />
  )
}
