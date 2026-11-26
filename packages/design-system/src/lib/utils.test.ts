import { describe, expect, test } from 'vitest'

import { cn } from '@portflow/design-system/lib/utils'

describe('cn', () => {
  test.each([
    ['text-label', 'text-text-muted'],
    ['text-body', 'text-info-foreground'],
    ['text-page-title', 'text-primary'],
    ['shadow-control', 'shadow-ring'],
  ])('keeps the semantic %s beside the colour %s', (semantic, colour) => {
    expect(cn(semantic, colour)).toBe(`${semantic} ${colour}`)
  })

  test.each([
    ['text-sm', 'text-label'],
    ['text-label', 'text-caption'],
    ['rounded-md', 'rounded-card'],
    ['rounded-control', 'rounded-none'],
    ['shadow-xs', 'shadow-control'],
    ['shadow-control', 'shadow-none'],
    // The sizes of the density: a class given by a consumer replaces the one of the atom.
    ['h-control', 'h-8'],
    ['size-control', 'size-8'],
    ['px-control-x', 'px-4'],
    ['py-cell', 'py-2'],
    ['-inset-hit', '-inset-2'],
  ])('lets %s give way to %s', (first, last) => {
    expect(cn(first, last)).toBe(last)
  })
})
