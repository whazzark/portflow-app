import { type ComponentProps, createContext, use, useId } from 'react'

import { cn } from '@portflow/design-system/lib/utils'

/** The ids that tie the label, the input and the error of one field together. */
type FieldIds = { input: string; error: string }

const FieldIdsContext = createContext<FieldIds | null>(null)

/** The ids of the field around the part that calls it. */
export function useFieldIds(): FieldIds {
  const ids = use(FieldIdsContext)
  if (ids === null) {
    throw new Error('A part of a field is rendered outside its <field.Field>')
  }

  return ids
}

type FieldProps = ComponentProps<'div'>

/** One field of a form: its label, its input and its error, one under the other. */
export function Field({ className, ...props }: FieldProps) {
  const id = useId()

  return (
    <FieldIdsContext value={{ input: `${id}-input`, error: `${id}-error` }}>
      <div className={cn('flex flex-col gap-2', className)} {...props} />
    </FieldIdsContext>
  )
}
