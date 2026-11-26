import type { AnyFieldApi } from '@tanstack/react-form'
import type { ComponentProps } from 'react'

import { Input } from '@portflow/design-system/atoms/input'

import { useFieldContext } from './contexts'
import { useFieldIds } from './field'
import { useShownError } from './shown-error'

type FieldInputProps = Omit<ComponentProps<typeof Input>, 'value' | 'onChange' | 'onBlur'>

// An error the server set on a field is about the value it was sent: it goes away as
// soon as the value changes.
function clearServerError(field: AnyFieldApi) {
  if (field.state.meta.errorMap.onServer === undefined) {
    return
  }

  field.setMeta((meta) => ({ ...meta, errorMap: { ...meta.errorMap, onServer: undefined } }))
}

// The input atom bound to the field: its value, its focus, and the error it shows.
function FieldInput({ className, ...props }: FieldInputProps) {
  const field = useFieldContext<string>()
  const ids = useFieldIds()
  const error = useShownError()

  return (
    <Input
      id={ids.input}
      name={field.name}
      value={field.state.value}
      onBlur={field.handleBlur}
      onChange={(event) => {
        clearServerError(field)
        field.handleChange(event.target.value)
      }}
      aria-invalid={error !== undefined || undefined}
      aria-describedby={error === undefined ? undefined : ids.error}
      className={className}
      {...props}
    />
  )
}

/** An input of text. Its value is the text the user types. */
export function TextInput(props: FieldInputProps) {
  return <FieldInput type="text" {...props} />
}

/**
 * An input of a number, with the decimal keyboard on a touch screen. Its value stays
 * the text the user types: the schema of the form reads the number from it.
 */
export function NumberInput(props: FieldInputProps) {
  return <FieldInput type="text" inputMode="decimal" autoComplete="off" {...props} />
}
