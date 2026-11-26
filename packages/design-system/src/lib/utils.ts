import { type ClassValue, clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

import { RADIUS_ROLES, SHADOW_ROLES, TYPE_ROLES } from '@portflow/design-system/styles/constants'

// The semantic sizes, radii and shadows of `theme.css`: without them, `text-label` would
// be taken for a colour and dropped beside `text-text-muted`.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [...TYPE_ROLES],
      radius: [...RADIUS_ROLES],
      shadow: [...SHADOW_ROLES],
    },
  },
})

/** Joins class names and lets the last Tailwind utility win (the helper of shadcn/ui). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
