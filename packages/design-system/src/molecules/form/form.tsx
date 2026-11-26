import type { ComponentProps, FormEvent } from 'react'

import { cn } from '@portflow/design-system/lib/utils'

import { useFormContext } from './contexts'

type FormProps = Omit<ComponentProps<'form'>, 'onSubmit'>

/**
 * The form element. Submitting runs the schema, then the `onSubmit` of the form; the
 * browser does not validate on its own.
 */
export function Form({ className, ...props }: FormProps) {
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
