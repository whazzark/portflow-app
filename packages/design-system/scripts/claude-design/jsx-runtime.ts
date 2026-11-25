// The automatic JSX runtime over `React.createElement`, for the bundle of Claude Design:
// its previews load React 18 as a global, which has no `react/jsx-runtime` of its own.
import * as React from 'react'

type Props = Record<string, unknown> | null

export const Fragment = React.Fragment

export function jsx(type: React.ElementType, props: Props, key?: React.Key) {
  return React.createElement(type, key === undefined ? props : { ...props, key })
}

export const jsxs = jsx
