import type { AnyFormApi } from '@tanstack/react-form'

import { showErrorToast } from '@portflow/design-system/molecules/toasts'

import { ApiError } from '@/shared/api/problem'

import { type FieldOfPointer, toFormErrors } from './field-errors'

/**
 * Shows why the API refused a submitted form (ADR 0021): the fields it names under
 * those fields, everything else in a toast with the label of its code. The values the
 * user typed stay. Call it from the `onSubmit` of the form, with the error its request
 * threw; an error that does not come from the API is thrown again.
 */
/** What `showSubmitError` needs of the form: setting the errors of its fields. */
type SubmittedForm = Pick<AnyFormApi, 'setErrorMap'>

export function showSubmitError<Name extends string>(
  form: SubmittedForm,
  error: unknown,
  fieldOf: FieldOfPointer<Name>,
) {
  if (!(error instanceof ApiError)) {
    throw error
  }

  const { fields, unmatched } = toFormErrors(error, fieldOf)
  const shownUnderFields = Object.keys(fields).length > 0

  if (shownUnderFields) {
    form.setErrorMap({ onServer: { fields } })
  }
  if (!shownUnderFields || unmatched) {
    showErrorToast(error.label)
  }
}
