import type { ComponentProps } from 'react'

import { cn } from '@portflow/design-system/lib/utils'

/**
 * What a section or a page shows when its data could not be read: an alert, read out
 * when it appears, with the message and a way to try again.
 */
export function ErrorState({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      role="alert"
      className={cn(
        'flex w-full flex-col items-start gap-3 rounded-lg border border-danger bg-surface p-4',
        className,
      )}
      {...props}
    />
  )
}

/** What went wrong, in the words of the user. */
export function ErrorStateMessage({ className, ...props }: ComponentProps<'p'>) {
  return <p className={cn('text-text', className)} {...props} />
}

/** The way out of the error: usually a button that tries again. */
export function ErrorStateActions({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex flex-wrap gap-2', className)} {...props} />
}
