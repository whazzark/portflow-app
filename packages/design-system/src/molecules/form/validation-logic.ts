import type { AnyFieldMeta, ValidationLogicFn } from '@tanstack/react-form'

/** Whether the field shows its errors: once it lost the focus, or the form was submitted. */
export function showsErrors(meta: AnyFieldMeta | undefined, submissionAttempts: number): boolean {
  if (meta === undefined || meta.errors.length === 0) {
    return false
  }

  return meta.isBlurred || submissionAttempts > 0
}

/**
 * When the schema runs (ADR 0021): when a field loses the focus and when the form is
 * submitted, then at each change of a field that shows an error, so that the error goes
 * away as soon as it is corrected. Submitting also clears the errors the server set.
 */
export const formValidationLogic: ValidationLogicFn = ({
  event,
  form,
  validators,
  runValidation,
}) => {
  const schema = {
    fn: event.async ? validators?.onDynamicAsync : validators?.onDynamic,
    cause: 'dynamic' as const,
  }
  const clearServerErrors = { fn: () => undefined, cause: 'server' as const }

  switch (event.type) {
    case 'blur':
      return runValidation({ form, validators: [schema] })
    case 'submit':
      return runValidation({
        form,
        validators: event.async ? [schema] : [schema, clearServerErrors],
      })
    case 'change': {
      const meta = event.fieldName === undefined ? undefined : form.getFieldMeta(event.fieldName)
      const shown = showsErrors(meta, form.state.submissionAttempts)

      return runValidation({ form, validators: shown ? [schema] : [] })
    }
    default:
      return runValidation({ form, validators: [] })
  }
}
