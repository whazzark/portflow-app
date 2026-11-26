import type { ComponentProps } from 'react'

import { cn } from '@portflow/design-system/lib/utils'

/** A page of one column, centred: the technical pages and the states of a route. */
export function PageLayout({ className, ...props }: ComponentProps<'main'>) {
  return (
    <main
      className={cn('mx-auto flex w-full max-w-xl flex-col items-start gap-4 p-4', className)}
      {...props}
    />
  )
}

export function PageLayoutTitle({ className, children, ...props }: ComponentProps<'h1'>) {
  return (
    <h1 className={cn('text-2xl font-semibold', className)} {...props}>
      {children}
    </h1>
  )
}
