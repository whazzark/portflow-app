import { createFormHook } from '@tanstack/react-form'

import { fieldContext, formContext } from './contexts'
import { Field } from './field'
import { FieldError } from './field-error'
import { NumberInput, TextInput } from './field-input'
import { FieldLabel } from './field-label'
import { Form } from './form'
import { SubmitButton } from './submit-button'
import { formValidationLogic } from './validation-logic'

// The forms of the app (ADR 0021): TanStack Form bound once to the atoms. Each part of
// a form is a file of this folder; this one assembles them.

const { useAppForm: useBaseAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    Field,
    Label: FieldLabel,
    TextInput,
    NumberInput,
    Error: FieldError,
  },
  formComponents: { Form, SubmitButton },
})

/**
 * The form of a screen: `form.AppForm`, `form.Form`, `form.AppField` with the field
 * family (`Field`, `Label`, `TextInput`, `NumberInput`, `Error`), `form.SubmitButton`.
 * Its schema goes in `validators.onDynamic`; when it runs is decided here, never by a
 * screen.
 */
export const useAppForm: typeof useBaseAppForm = (options) =>
  useBaseAppForm({ ...options, validationLogic: formValidationLogic })

export { withForm }
