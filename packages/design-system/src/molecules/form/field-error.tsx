import type { ComponentProps } from 'react'

import { cn } from '@portflow/design-system/lib/utils'

import { useFieldIds } from './field'
import { useShownError } from './shown-error'

type FieldErrorProps = Omit<ComponentProps<'p'>, 'children'>

/** The error of the field, under it, read out when it appears. Empty while there is none. */
export function FieldError({ className, ...props }: FieldErrorProps) {
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
