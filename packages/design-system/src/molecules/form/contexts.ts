import { createFormHookContexts } from '@tanstack/react-form'

/**
 * The contexts through which the parts of a form read their field and their form. They
 * are bound once, by `useAppForm`.
 */
export const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts()
