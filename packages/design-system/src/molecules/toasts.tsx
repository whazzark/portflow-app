import { toast } from 'sonner'

/**
 * Tells that an action went well: a form was saved, an action button did its job. The
 * text comes from the approved mock-up. Needs the `Toaster` atom, rendered once near the
 * root.
 */
export function showSuccessToast(message: string) {
  return toast.success(message)
}

/**
 * Tells that an action failed for a reason no field of a form can show: the label of
 * the error of the API. It stays as long as a success toast (ADR 0021). Needs the
 * `Toaster` atom, rendered once near the root.
 */
export function showErrorToast(message: string) {
  return toast.error(message)
}
