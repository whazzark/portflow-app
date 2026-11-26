import type { ComponentProps } from 'react'

import { Skeleton } from '@portflow/design-system/atoms/skeleton'
import { cn } from '@portflow/design-system/lib/utils'

/**
 * What a section or a page shows while its data loads: a live region (`status`) that
 * holds the label read to assistive technologies, and a placeholder of the content.
 */
export function LoadingState({ className, ...props }: ComponentProps<'output'>) {
  return <output className={cn('flex w-full flex-col gap-3', className)} {...props} />
}

/** The text of the loading state, such as "Loading…". */
export function LoadingStateLabel({ className, ...props }: ComponentProps<'p'>) {
  return <p className={cn('text-sm text-text-muted', className)} {...props} />
}

/** Grey lines standing for the content that loads; hidden from assistive technologies. */
export function LoadingStatePlaceholder({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div aria-hidden className={cn('flex flex-col gap-2', className)} {...props}>
      <Skeleton className="h-control w-full" />
      <Skeleton className="h-control w-full" />
      <Skeleton className="h-control w-2/3" />
    </div>
  )
}
