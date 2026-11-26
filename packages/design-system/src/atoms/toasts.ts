import { toast } from 'sonner'

// The toasts the app shows, through the `Toaster` of `atoms/sonner`, rendered once near the
// root. Kept apart from that file, which the shadcn CLI writes.

/**
 * Tells something with no state and nothing to do: a step that started, a note on the
 * screen, such as "Export started". It keeps the colours of the surface. Prefer a toast
 * of a state when there is one. Needs the `Toaster`, rendered once near the root.
 */
export function showNeutralToast(message: string) {
  return toast(message)
}

type UndoToast = {
  /** What was just done, such as "Weighing deleted". */
  message: string
  /** The label of the action, such as "Undo". */
  undoLabel: string
  onUndo: () => void
}

/**
 * Tells that an action was done and offers to undo it for a few seconds: a visible
 * correction path rather than a confirmation dialog. Needs the `Toaster`, rendered once
 * near the root.
 */
export function showUndoToast({ message, undoLabel, onUndo }: UndoToast) {
  return toast(message, { action: { label: undoLabel, onClick: onUndo } })
}

/**
 * Tells that an action went well: a form was saved, an action button did its job. The
 * text comes from the approved mock-up. Needs the `Toaster`, rendered once near the root.
 */
export function showSuccessToast(message: string) {
  return toast.success(message)
}

/**
 * Tells that an action failed for a reason no field of a form can show: the label of
 * the error of the API. It stays as long as a success toast (ADR 0021). Needs the
 * `Toaster`, rendered once near the root.
 */
export function showErrorToast(message: string) {
  return toast.error(message)
}

/**
 * Gives a neutral piece of information: neither the result of an action nor a failure,
 * such as a service that restarts at a given time. The text comes from the approved
 * mock-up. Needs the `Toaster`, rendered once near the root.
 */
export function showInfoToast(message: string) {
  return toast.info(message)
}

/**
 * Tells that something needs attention without having failed: a limit almost reached,
 * an input that will be rounded. The text comes from the approved mock-up. Needs the
 * `Toaster`, rendered once near the root.
 */
export function showWarningToast(message: string) {
  return toast.warning(message)
}
