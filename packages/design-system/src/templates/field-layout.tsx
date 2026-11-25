import type { ComponentProps } from 'react'

import { cn } from '@portflow/design-system/lib/utils'

/*
 * The layout of the field screens: one task per screen, its actions kept in reach at
 * the bottom. It sets the field density, so every control inside is a touch target of
 * at least 44px whatever the device.
 */

export function FieldLayout({ className, ...props }: ComponentProps<'div'>) {
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
