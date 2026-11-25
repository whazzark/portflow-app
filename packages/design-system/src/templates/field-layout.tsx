import { type ComponentProps, useEffect } from 'react'

import { cn } from '@portflow/design-system/lib/utils'

/*
 * The layout of the field screens: one task per screen, its actions kept in reach at
 * the bottom. It sets the field density, so every control is a touch target of at least
 * 44px whatever the device: on its own element, and on the document while it is shown,
 * for the selects, dialogs and toasts that render at the root.
 */

// How many field layouts are shown, and the density of the document before the first:
// several can be shown at once (a page and a dialog, a page of stories), and the density
// is given back only when the last one goes.
let shown = 0
let densityBefore: string | undefined

function holdFieldDensity() {
  const root = document.documentElement
  if (shown === 0) densityBefore = root.dataset.density
  shown += 1
  root.dataset.density = 'field'
}

function releaseFieldDensity() {
  shown -= 1
  if (shown > 0) return
  const root = document.documentElement
  if (densityBefore === undefined) delete root.dataset.density
  else root.dataset.density = densityBefore
}

export function FieldLayout({ className, ...props }: ComponentProps<'div'>) {
  useEffect(() => {
    holdFieldDensity()
    return releaseFieldDensity
  }, [])

  return (
    <div
      data-density="field"
      className={cn('flex min-h-dvh flex-col bg-background', className)}
      {...props}
    />
  )
}

export function FieldLayoutHeader({ className, ...props }: ComponentProps<'header'>) {
  return (
    <header
      className={cn('flex items-center gap-3 border-b bg-surface px-4 py-3', className)}
      {...props}
    />
  )
}

/** The task of the screen. */
export function FieldLayoutTitle({ className, children, ...props }: ComponentProps<'h1'>) {
  return (
    <h1 className={cn('text-xl font-semibold', className)} {...props}>
      {children}
    </h1>
  )
}

export function FieldLayoutContent({ className, ...props }: ComponentProps<'main'>) {
  return (
    <main
      className={cn('mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-4', className)}
      {...props}
    />
  )
}

/** The actions of the task, pinned at the bottom of the screen. */
export function FieldLayoutActions({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'sticky bottom-0 flex flex-col gap-2 border-t bg-surface p-4 sm:flex-row sm:justify-end',
        className,
      )}
      {...props}
    />
  )
}
