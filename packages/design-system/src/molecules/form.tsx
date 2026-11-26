import {
  type AnyFieldApi,
  type AnyFieldMeta,
  createFormHook,
  createFormHookContexts,
  useStore,
  type ValidationLogicFn,
} from '@tanstack/react-form'
import { type ComponentProps, createContext, type FormEvent, use, useId } from 'react'

import { Input } from '@portflow/design-system/atoms/input'
import { Label } from '@portflow/design-system/atoms/label'
import { cn } from '@portflow/design-system/lib/utils'
import { PendingButton } from '@portflow/design-system/molecules/pending-button'

// The forms of the app (ADR 0020): TanStack Form bound once to the atoms. A form passes
// its Zod schema as `validators.onDynamic`; `useAppForm` decides when it runs.

const { fieldContext, formContext, useFieldContext, useFormContext } = createFormHookContexts()

/** Whether the field shows its errors: once it lost the focus, or the form was submitted. */
function showsErrors(meta: AnyFieldMeta | undefined, submissionAttempts: number): boolean {
  if (meta === undefined || meta.errors.length === 0) return false
  return meta.isBlurred || submissionAttempts > 0
}

/**
 * When the schema runs: when a field loses the focus and when the form is submitted,
 * then at each change of a field that shows an error, so that the error goes away as
 * soon as it is corrected. Submitting also clears the errors the server set.
 */
const formValidationLogic: ValidationLogicFn = ({ event, form, validators, runValidation }) => {
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

/** The text of the first error of a field: a message of the schema, or a label of the API. */
function firstMessage(errors: readonly unknown[]): string | undefined {
  for (const error of errors.flat()) {
    if (typeof error === 'string') return error
    if (typeof error === 'object' && error !== null && 'message' in error) {
      if (typeof error.message === 'string') return error.message
    }
  }
  return undefined
}

/** The error the field shows now, if any. */
function useShownError(): string | undefined {
  const field = useFieldContext<unknown>()
  const meta = useStore(field.store, (state) => state.meta)
  const submissionAttempts = useStore(field.form.store, (state) => state.submissionAttempts)
  return showsErrors(meta, submissionAttempts) ? firstMessage(meta.errors) : undefined
}

type FieldIds = { input: string; error: string }

const FieldIdsContext = createContext<FieldIds | null>(null)

function useFieldIds(): FieldIds {
  const ids = use(FieldIdsContext)
  if (ids === null) throw new Error('A part of a field is rendered outside its <field.Field>')
  return ids
}

/** One field of a form: its label, its input and its error, one under the other. */
function Field({ className, ...props }: ComponentProps<'div'>) {
  const id = useId()
  return (
    <FieldIdsContext value={{ input: `${id}-input`, error: `${id}-error` }}>
      <div className={cn('flex flex-col gap-2', className)} {...props} />
    </FieldIdsContext>
  )
}

/** The label of the field, bound to its input. */
function FieldLabel(props: ComponentProps<typeof Label>) {
  const { input } = useFieldIds()
  return <Label htmlFor={input} {...props} />
}

// An error the server set on a field is about the value it was sent: it goes away as
// soon as the value changes.
function clearServerError(field: AnyFieldApi) {
  if (field.state.meta.errorMap.onServer === undefined) return
  field.setMeta((meta) => ({ ...meta, errorMap: { ...meta.errorMap, onServer: undefined } }))
}

type FieldInputProps = Omit<ComponentProps<typeof Input>, 'value' | 'onChange' | 'onBlur'>

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
function TextInput(props: FieldInputProps) {
  return <FieldInput type="text" {...props} />
}

/**
 * An input of a number, with the decimal keyboard on a touch screen. Its value stays
 * the text the user types: the schema of the form reads the number from it.
 */
function NumberInput(props: FieldInputProps) {
  return <FieldInput type="text" inputMode="decimal" autoComplete="off" {...props} />
}

/** The error of the field, under it, read out when it appears. Empty while there is none. */
function FieldError({ className, ...props }: Omit<ComponentProps<'p'>, 'children'>) {
  const { error } = useFieldIds()
  const message = useShownError()
  return (
    <p
      id={error}
      aria-live="polite"
      className={cn('text-sm text-danger empty:hidden', className)}
      {...props}
    >
      {message}
    </p>
  )
}

/**
 * The form element. Submitting runs the schema, then the `onSubmit` of the form; the
 * browser does not validate on its own.
 */
function Form({ className, ...props }: Omit<ComponentProps<'form'>, 'onSubmit'>) {
  const form = useFormContext()
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    event.stopPropagation()
    void form.handleSubmit()
  }
  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className={cn('flex flex-col gap-4', className)}
      {...props}
    />
  )
}

/** The button that submits the form: disabled, with a spinner, while the form is sent. */
function SubmitButton(props: Omit<ComponentProps<typeof PendingButton>, 'pending' | 'type'>) {
  const form = useFormContext()
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting)
  return <PendingButton type="submit" pending={isSubmitting} {...props} />
}

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
