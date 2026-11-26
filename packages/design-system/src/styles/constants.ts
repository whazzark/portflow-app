/** The themes of the tokens, the values of `data-theme`. Light is the default. */
export const THEMES = ['light', 'dark', 'contrast'] as const

/** The densities of the tokens, the values of `data-density`. Office is the default. */
export const DENSITIES = ['office', 'field'] as const

export type Theme = (typeof THEMES)[number]
export type Density = (typeof DENSITIES)[number]

/** The roles of the semantic type utilities of `theme.css`: `text-page-title`... */
export const TYPE_ROLES = [
  'page-title',
  'task-title',
  'section-title',
  'body',
  'control',
  'label',
  'caption',
  'badge',
] as const

/** The roles of the semantic radius utilities of `theme.css`: `rounded-control`... */
export const RADIUS_ROLES = ['control', 'item', 'overlay', 'card', 'pill'] as const

/** The roles of the semantic shadow utilities of `theme.css`: `shadow-control`... */
export const SHADOW_ROLES = ['control', 'raised', 'overlay', 'dialog'] as const

/** The sizes of the density in `theme.css`: `h-control`, `px-control-x`, `py-cell`, `-inset-hit`. */
export const SPACING_ROLES = ['control', 'control-x', 'cell', 'hit'] as const
