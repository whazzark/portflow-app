import { toast } from 'sonner'

type UndoToast = {
  /** What was just done, such as "Weighing deleted". */
  message: string
  /** The label of the action, such as "Undo". */
  undoLabel: string
  onUndo: () => void
}

/**
 * Tells that an action was done and offers to undo it for a few seconds: a visible
 * correction path rather than a confirmation dialog. Needs the `Toaster` atom, rendered
 * once near the root.
 */
export function showUndoToast({ message, undoLabel, onUndo }: UndoToast) {
  return toast(message, { action: { label: undoLabel, onClick: onUndo } })
}
