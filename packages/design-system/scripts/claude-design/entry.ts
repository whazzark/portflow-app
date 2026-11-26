// What the bundle of Claude Design exposes as `window.Portflow`: every atom, molecule
// and template of the package, the styles, and `toast` to show a toast in a preview.
// It also gives the previews and mock-ups its React, as the globals `React` and
// `ReactDOM` they use, so that everything renders with the React the atoms are written for.
import * as React from 'react'
import { createPortal, flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'

import './styles.css'

Object.assign(globalThis, {
  React,
  ReactDOM: { createRoot, createPortal, flushSync },
})

export * from '@portflow/design-system/atoms/badge'
export * from '@portflow/design-system/atoms/button'
export * from '@portflow/design-system/atoms/checkbox'
export * from '@portflow/design-system/atoms/dialog'
export * from '@portflow/design-system/atoms/input'
export * from '@portflow/design-system/atoms/label'
export * from '@portflow/design-system/atoms/select'
export * from '@portflow/design-system/atoms/skeleton'
export * from '@portflow/design-system/atoms/sonner'
export * from '@portflow/design-system/atoms/table'
export * from '@portflow/design-system/atoms/tabs'
export * from '@portflow/design-system/atoms/tooltip'
export * from '@portflow/design-system/molecules/empty-state'
export * from '@portflow/design-system/molecules/error-state'
export * from '@portflow/design-system/molecules/loading-state'
export * from '@portflow/design-system/molecules/responsive-table'
export * from '@portflow/design-system/molecules/undo-toast'
export * from '@portflow/design-system/templates/field-layout'
export * from '@portflow/design-system/templates/office-layout'
export * from '@portflow/design-system/templates/page-layout'
export { toast } from 'sonner'
