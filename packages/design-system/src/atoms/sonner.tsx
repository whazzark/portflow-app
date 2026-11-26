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

// The toasts take the colours of the tokens, so they follow the theme of the page. A
// success, an error, a warning and an information are filled with the colour of their
// state, their text in its `-text` token: the pairs `contrast.test.ts` checks.
const TOKEN_STYLE = {
  '--normal-bg': 'var(--surface)',
  '--normal-text': 'var(--text)',
  '--normal-border': 'var(--border-strong)',
  '--border-radius': 'var(--radius-md)',
  '--success-bg': 'var(--success)',
  '--success-border': 'var(--success)',
  '--success-text': 'var(--toaster-success-text)',
  '--error-bg': 'var(--danger)',
  '--error-border': 'var(--danger)',
  '--error-text': 'var(--toaster-danger-text)',
  '--warning-bg': 'var(--warning)',
  '--warning-border': 'var(--warning)',
  '--warning-text': 'var(--toaster-warning-text)',
  '--info-bg': 'var(--info)',
  '--info-border': 'var(--info)',
  '--info-text': 'var(--toaster-info-text)',
} as CSSProperties

// Sonner gives its own colours to `--success-text`, `--warning-text` and `--info-text`,
// the names of our tokens, on its list: the list cannot read our value under the same
// name. Its parent reads the tokens under other names, which the list takes back.
const STATE_TEXT_STYLE = {
  '--toaster-success-text': 'var(--success-text)',
  '--toaster-danger-text': 'var(--danger-text)',
  '--toaster-warning-text': 'var(--warning-text)',
  '--toaster-info-text': 'var(--info-text)',
} as CSSProperties

// Sonner's stylesheet is outside any CSS layer, so it wins over the layered utilities of
// Tailwind: these classes are marked `!`. A toast and its list take the focus ring (sonner
// draws a 20% black band), and the action follows the density. The list gets the focus
// only from sonner's Alt+T shortcut, which browsers do not count as keyboard focus for
// `:focus-visible`: it draws the ring on any focus.
const FOCUS_RING = 'focus-visible:ring-3! focus-visible:ring-ring!'
const LIST_FOCUS_RING = 'focus:ring-3! focus:ring-ring!'
// A button inside a toast sits on its fill, which can be the colour of a state: a halo of
// the page colour sets the ring apart from that fill.
const INNER_FOCUS_RING = `${FOCUS_RING} focus-visible:ring-offset-2! focus-visible:ring-offset-background!`
// On a coloured toast the action swaps the two colours of the state, so that it stands
// out from the fill as much as the text does.
const COLOURED_ACTION = [
  'in-data-[type=success]:bg-success-foreground! in-data-[type=success]:text-success!',
  'in-data-[type=error]:bg-danger-foreground! in-data-[type=error]:text-danger!',
  'in-data-[type=warning]:bg-warning-foreground! in-data-[type=warning]:text-warning!',
  'in-data-[type=info]:bg-info-foreground! in-data-[type=info]:text-info!',
].join(' ')
const CLASS_NAMES = {
  toast: FOCUS_RING,
  actionButton: `h-control! rounded-md! bg-primary! px-control-x! text-primary-foreground! ${COLOURED_ACTION} ${INNER_FOCUS_RING}`,
  // Sonner turns the close button light grey on hover, whatever the colour of its text:
  // it keeps the colours of its toast instead.
  closeButton: `hover:bg-inherit! hover:border-inherit! ${INNER_FOCUS_RING}`,
}

/** Where the toasts of the app appear: rendered once, near the root. */
export function Toaster({ className, style, toastOptions, ...props }: ToasterProps) {
  return (
    <div data-toaster-tokens className="contents" style={STATE_TEXT_STYLE}>
      <Sonner
        className={cn('toaster group', LIST_FOCUS_RING, className)}
        icons={{
          success: <CircleCheckIcon className="size-4" />,
          info: <InfoIcon className="size-4" />,
          warning: <TriangleAlertIcon className="size-4" />,
          error: <OctagonXIcon className="size-4" />,
          loading: <Loader2Icon className="size-4 animate-spin" />,
        }}
        richColors
        style={{ ...TOKEN_STYLE, ...style }}
        toastOptions={{
          ...toastOptions,
          classNames: {
            ...toastOptions?.classNames,
            toast: cn(CLASS_NAMES.toast, toastOptions?.classNames?.toast),
            actionButton: cn(CLASS_NAMES.actionButton, toastOptions?.classNames?.actionButton),
            closeButton: cn(CLASS_NAMES.closeButton, toastOptions?.classNames?.closeButton),
          },
        }}
        {...props}
      />
    </div>
  )
}
