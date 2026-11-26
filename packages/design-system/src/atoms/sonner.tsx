import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from 'lucide-react'
import type { CSSProperties } from 'react'
import { Toaster as Sonner, type ToasterProps } from 'sonner'

import { cn } from '@portflow/design-system/lib/utils'

// The toasts take the colours of the tokens, so they follow the theme of the page.
const TOKEN_STYLE = {
  '--normal-bg': 'var(--surface)',
  '--normal-text': 'var(--text)',
  '--normal-border': 'var(--border-strong)',
  '--border-radius': 'var(--radius-md)',
} as CSSProperties

// Sonner's stylesheet is outside any CSS layer, so it wins over the layered utilities of
// Tailwind: these classes are marked `!`. A toast and its list take the focus ring (sonner
// draws a 20% black band), and the action follows the density. The list gets the focus
// only from sonner's Alt+T shortcut, which browsers do not count as keyboard focus for
// `:focus-visible`: it draws the ring on any focus.
const FOCUS_RING = 'focus-visible:ring-3! focus-visible:ring-ring!'
const LIST_FOCUS_RING = 'focus:ring-3! focus:ring-ring!'
const CLASS_NAMES = {
  toast: FOCUS_RING,
  actionButton: `h-control! rounded-md! bg-primary! px-control-x! text-primary-foreground! ${FOCUS_RING}`,
}

/** Where the toasts of the app appear: rendered once, near the root. */
export function Toaster({ className, style, toastOptions, ...props }: ToasterProps) {
  return (
    <Sonner
      className={cn('toaster group', LIST_FOCUS_RING, className)}
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={{ ...TOKEN_STYLE, ...style }}
      toastOptions={{
        ...toastOptions,
        classNames: {
          ...toastOptions?.classNames,
          toast: cn(CLASS_NAMES.toast, toastOptions?.classNames?.toast),
          actionButton: cn(CLASS_NAMES.actionButton, toastOptions?.classNames?.actionButton),
        },
      }}
      {...props}
    />
  )
}
