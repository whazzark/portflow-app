import { useStore } from '@tanstack/react-form'

import { useFieldContext } from './contexts'
import { showsErrors } from './validation-logic'

/** An issue of a Standard Schema, as TanStack Form keeps it: only its message is read. */
type SchemaIssue = { message: string }

function hasMessage(error: unknown): error is SchemaIssue {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  )
}

/** The text of the first error of a field: a message of the schema, or a label of the API. */
function firstMessage(errors: ReadonlyArray<unknown>): string | undefined {
  for (const error of errors.flat()) {
    if (typeof error === 'string') {
      return error
    }
    if (hasMessage(error)) {
      return error.message
    }
  }

  return undefined
}

/** The error the field shows now, if any. */
export function useShownError(): string | undefined {
  const field = useFieldContext<unknown>()
  const meta = useStore(field.store, (state) => state.meta)
  const submissionAttempts = useStore(field.form.store, (state) => state.submissionAttempts)

  return showsErrors(meta, submissionAttempts) ? firstMessage(meta.errors) : undefined
}
