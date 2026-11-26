import { Loader2Icon } from 'lucide-react'
import type { ComponentProps } from 'react'

import { Button } from '@portflow/design-system/atoms/button'

type PendingButtonProps = ComponentProps<typeof Button> & {
  /** The action of the button runs: it cannot be pressed again until it ends. */
  pending: boolean
}

/**
 * A button whose action takes time: a submit button, or an action button bound to the
 * pending state of its mutation. While its action runs, it is disabled, shows a spinner
 * and says it is busy, so that the action is never sent twice.
 */
export function PendingButton({ pending, disabled, children, ...props }: PendingButtonProps) {
  return (
    <Button disabled={disabled || pending} aria-busy={pending || undefined} {...props}>
      {pending ? <Loader2Icon aria-hidden className="animate-spin" /> : null}
      {children}
    </Button>
  )
}
