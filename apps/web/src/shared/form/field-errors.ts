import type { ApiError } from '@/shared/api/problem'

/**
 * The field of a form a JSON Pointer of the request body names, or `undefined` when it
 * names none. Written next to the mapper of the form, which alone knows how the values
 * become the body (ADR 0021).
 */
export type FieldOfPointer<Name extends string> = (pointer: string) => Name | undefined

/** The errors of the API, as a form shows them. */
export type FormErrors<Name extends string> = {
  /** The label to show under each field the API refused. */
  fields: Partial<Record<Name, string>>
  /** Whether the API refused a field that the form does not have. */
  unmatched: boolean
}

/** The fields an error of the API names, mapped to the fields of a form. */
export function toFormErrors<Name extends string>(
  error: ApiError,
  fieldOf: FieldOfPointer<Name>,
): FormErrors<Name> {
  const fields: Partial<Record<Name, string>> = {}
  let unmatched = false

  for (const { pointer, label } of error.fieldErrors) {
    const field = fieldOf(pointer)
    if (field === undefined) {
      unmatched = true
    } else {
      fields[field] ??= label
    }
  }

  return { fields, unmatched }
}
