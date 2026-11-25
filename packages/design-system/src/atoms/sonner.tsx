import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from 'lucide-react'
import type { CSSProperties } from 'react'
import { Toaster as Sonner, type ToasterProps } from 'sonner'

// The toasts take the colours of the tokens, so they follow the theme of the page.
const TOKEN_STYLE = {
  '--normal-bg': 'var(--surface)',
  '--normal-text': 'var(--text)',
  '--normal-border': 'var(--border-strong)',
  '--border-radius': 'var(--radius-md)',
} as CSSProperties

/** Where the toasts of the app appear: rendered once, near the root. */
export function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={TOKEN_STYLE}
      {...props}
    />
  )
}
