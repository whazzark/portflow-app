import type { ComponentProps } from 'react'

import { cn } from '@portflow/design-system/lib/utils'

/** What a list or a page shows when there is nothing to show yet, and what to do about it. */
export function EmptyState({ className, ...props }: ComponentProps<'section'>) {
  return (
    <section
      className={cn(
        'flex w-full flex-col items-start gap-3 rounded-lg border border-dashed border-border-strong p-6',
        className,
      )}
      {...props}
    />
  )
}

export function EmptyStateTitle({ className, children, ...props }: ComponentProps<'h2'>) {
  return (
    <h2 className={cn('text-lg font-semibold', className)} {...props}>
      {children}
    </h2>
  )
}

export function EmptyStateDescription({ className, ...props }: ComponentProps<'p'>) {
  return <p className={cn('text-sm text-text-muted', className)} {...props} />
}

/** The action that fills the empty state: create the first item, change the filters. */
export function EmptyStateActions({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex flex-wrap gap-2', className)} {...props} />
}
