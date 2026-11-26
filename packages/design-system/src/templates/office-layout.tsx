import type { ComponentProps } from 'react'

import { cn } from '@portflow/design-system/lib/utils'

/*
 * The layout of the office screens: a navigation and the content. Below `lg` the
 * navigation is a bar above the content, whose links scroll sideways inside it, with
 * room for their focus ring when the focus scrolls one into view; from
 * `lg` it is a column on the left. The page itself never scrolls sideways.
 */

export function OfficeLayout({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex min-h-dvh flex-col lg:flex-row', className)} {...props} />
}

/** The navigation; name it with `aria-label`. */
export function OfficeLayoutNav({ className, ...props }: ComponentProps<'nav'>) {
  return (
    <nav
      className={cn(
        'flex flex-col gap-3 border-b bg-surface-muted p-4 lg:w-64 lg:shrink-0 lg:border-r lg:border-b-0',
        className,
      )}
      {...props}
    />
  )
}

/** The name of the product or of the area, at the top of the navigation. */
export function OfficeLayoutNavTitle({ className, ...props }: ComponentProps<'p'>) {
  return <p className={cn('text-lg font-semibold', className)} {...props} />
}

export function OfficeLayoutNavList({ className, ...props }: ComponentProps<'ul'>) {
  return (
    <ul
      className={cn(
        'flex scroll-px-1 gap-1 overflow-x-auto p-1 lg:flex-col lg:overflow-visible lg:p-0',
        className,
      )}
      {...props}
    />
  )
}

export function OfficeLayoutNavItem({ className, ...props }: ComponentProps<'li'>) {
  return <li className={cn('shrink-0', className)} {...props} />
}

export function OfficeLayoutContent({ className, ...props }: ComponentProps<'main'>) {
  return (
    <main className={cn('flex min-w-0 flex-1 flex-col gap-4 p-4 lg:p-6', className)} {...props} />
  )
}
