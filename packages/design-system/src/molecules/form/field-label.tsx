import type { ComponentProps } from 'react'

import { Label } from '@portflow/design-system/atoms/label'

import { useFieldIds } from './field'

type FieldLabelProps = ComponentProps<typeof Label>

/** The label of the field, bound to its input. */
export function FieldLabel(props: FieldLabelProps) {
  const { input } = useFieldIds()

  return <Label htmlFor={input} {...props} />
}
