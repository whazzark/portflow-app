/** The themes of the tokens, the values of `data-theme`. Light is the default. */
export const THEMES = ['light', 'dark', 'contrast'] as const

/** The densities of the tokens, the values of `data-density`. Office is the default. */
export const DENSITIES = ['office', 'field'] as const

export type Theme = (typeof THEMES)[number]
export type Density = (typeof DENSITIES)[number]
