import { useStore } from '@tanstack/react-form'
import type { ComponentProps } from 'react'

import { PendingButton } from '@portflow/design-system/atoms/button'

import { useFormContext } from './contexts'

type SubmitButtonProps = Omit<ComponentProps<typeof PendingButton>, 'pending' | 'type'>

/** The button that submits the form: disabled, with a spinner, while the form is sent. */
export function SubmitButton(props: SubmitButtonProps) {
  const form = useFormContext()
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting)

  return <PendingButton type="submit" pending={isSubmitting} {...props} />
}
