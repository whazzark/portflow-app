import type { ComponentProps } from 'react'

import { cn } from '@portflow/design-system/lib/utils'

/*
 * A dense table that becomes one card per row below `md`: the same elements at every
 * width, only the CSS changes. The header row is visually hidden on narrow screens and
 * each cell shows its column name (`label`) before its value instead.
 */

export function ResponsiveTable({ className, ...props }: ComponentProps<'table'>) {
  return (
    <table className={cn('w-full text-sm max-md:block md:caption-bottom', className)} {...props} />
  )
}

export function ResponsiveTableCaption({ className, ...props }: ComponentProps<'caption'>) {
  return (
    <caption
      className={cn(
        'text-left text-sm text-text-muted max-md:mb-3 max-md:block md:mt-4',
        className,
      )}
      {...props}
    />
  )
}

export function ResponsiveTableHeader({ className, ...props }: ComponentProps<'thead'>) {
  return <thead className={cn('max-md:sr-only [&_tr]:border-b', className)} {...props} />
}

export function ResponsiveTableBody({ className, ...props }: ComponentProps<'tbody'>) {
  return <tbody className={cn('max-md:flex max-md:flex-col max-md:gap-3', className)} {...props} />
}

export function ResponsiveTableRow({ className, ...props }: ComponentProps<'tr'>) {
  return (
    <tr
      className={cn(
        'border-b max-md:flex max-md:flex-col max-md:gap-1 max-md:rounded-lg max-md:border max-md:p-3 md:last:border-b-0',
        className,
      )}
      {...props}
    />
  )
}

export function ResponsiveTableHead({ className, ...props }: ComponentProps<'th'>) {
  return (
    <th className={cn('h-control px-2 text-left align-middle font-medium', className)} {...props} />
  )
}

type ResponsiveTableCellProps = ComponentProps<'td'> & {
  /** The name of the column, shown before the value when the row is a card. */
  label: string
}

export function ResponsiveTableCell({ label, className, ...props }: ResponsiveTableCellProps) {
  return (
    <td
      data-label={label}
      className={cn(
        'px-2 py-cell align-middle max-md:flex max-md:justify-between max-md:gap-4 max-md:px-0 max-md:before:font-medium max-md:before:text-text-muted max-md:before:content-[attr(data-label)]',
        className,
      )}
      {...props}
    />
  )
}
