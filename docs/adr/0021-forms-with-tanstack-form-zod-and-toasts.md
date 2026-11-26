# 0021. Forms with TanStack Form and Zod, outcomes in toasts

Status: accepted (2026-11-26)

Completes ADR 0004 (the web app), ADR 0012 and 0019 (the design system), ADR 0015
(problem details): a problem can now name the fields of the request it refuses, and
ADR 0020, which parses the responses with Zod: the forms use the same Zod.

## Context

The first product screens with a form are coming. Without a decision, each screen
would wire the atoms to its state by hand, validate in its own way, and tell the user
about an error or a success in its own place. Three things were missing:

- one way to build a form, from the atoms of the design system;
- one rule for where an error and a success are shown;
- a way for the API to say which field of a request it refuses: a problem only carries
  one `code` for the whole request (ADR 0015).

## Decision

- **TanStack Form** (`@tanstack/react-form`), bound once with `createFormHook`. The
  hook `useAppForm` and its components are molecules of the design system,
  `packages/design-system/src/molecules/form/`, one file per part, assembled by
  `use-app-form.tsx`: they bind the state of a field to the atoms (`Label`, `Input`,
  `Button`) and carry no data and no domain vocabulary.
  Mapping an error of the API to the fields stays in the web app, in
  `apps/web/src/shared/form/`, since the design system imports nothing of the API.
- **Composition, not configuration.** A field is a family of small components that read
  the field from its context, assembled by the caller (`.claude/rules/frontend.md`):

  ```tsx
  <form.AppForm>
    <form.Form>
      <form.AppField name="tonnage">
        {(field) => (
          <field.Field>
            <field.Label>Tonnage</field.Label>
            <field.NumberInput />
            <field.Error />
          </field.Field>
        )}
      </form.AppField>
      <form.SubmitButton>Save</form.SubmitButton>
    </form.Form>
  </form.AppForm>
  ```

- **One Zod schema per form, written by hand**, in `features/<context>/model/`, on the
  values the user types: the text of each input. Zod 4 is a Standard Schema, which
  TanStack Form takes without an adapter. Next to it, in the same file:
  - a mapper from the values to the body of the request, typed by
    `@portflow/contracts`: a change of the API that the mapper does not follow breaks
    the compilation;
  - a function from a JSON Pointer of that body to the name of a field, which the
    mapper alone knows.

  The API stays the authority on the rules; the schema only spares a round trip.
- **When a field is validated:** when it loses the focus and when the form is
  submitted; then at each change, once the field shows an error, so that the error goes
  away as soon as it is corrected. An error shows once the field has lost the focus or
  the form was submitted. This is set once, by `useAppForm`, never by a screen.
- **Where an error is shown:**
  - an error of the schema, under the field it concerns;
  - a problem `VALIDATION_FAILED` whose `errors` name fields of the form, under those
    fields; a pointer that names no field of the form adds a toast with the label of
    the code;
  - every other error (another code, a `422` that names no field, no network), in a
    toast with the label of its code (`ApiError.label`, ADR 0015).

  An error set by the API on a field goes away when that field changes.
- **Success is shown in a toast**, after a form and after an action button alike. Its
  text comes from the approved mock-up.
- **Toasts** are the `sonner` atom: its `Toaster`, mounted once in `apps/web/src/app/`,
  and its `showSuccessToast` and `showErrorToast`, which call that one primitive and so
  belong to its atom, not to a molecule. The web app does not import `sonner`. A
  success and an error stay the same time, the default of sonner. The toast with undo,
  `showUndoToast`, moves to the same atom for the same reason.
- **Pending state.** While a form is submitted or an action runs, its button is
  disabled, shows a spinner and carries `aria-busy`, so that an action is never sent
  twice (`PendingButton`). The values the user typed stay after a failure.
- **The field errors of a problem.** A problem may carry `errors`, a list of
  `{ pointer, code }`:
  - `pointer` is a JSON Pointer (RFC 6901) into the body of the request, such as
    `/tonnage`, as RFC 9457 §3 suggests for an extension member;
  - `code` is a value of the enumeration `FieldErrorCode` of the contract, with its
    label in the web app, like the codes of ADR 0015.

  A problem with `errors` has the code `VALIDATION_FAILED` and the status `422`. The
  first codes are generic: `REQUIRED`, `INVALID_FORMAT`, `OUT_OF_RANGE`, `TOO_LONG`.
  **The set grows with each form**: a form, or an endpoint that validates a body,
  checks that each refusal of a field it can produce has a code that says it precisely,
  and adds the code in the same pull request otherwise. A business refusal gets its
  own code, not a generic one. A code is never renamed or removed (ADR 0015).
- **Versions:** `@tanstack/react-form` 1.33.5, pinned, released weeks before this
  decision and maintained; `zod` and `sonner` stay at the versions ADR 0020 and the
  design system pinned.

## Consequences

- A screen with a form writes a schema, a mapper and a pointer function in `model/`,
  and assembles the field family. It never wires an atom to a field by hand.
- The design system depends on `@tanstack/react-form`. Its form molecules are shown in
  Storybook and in Claude Design like the others.
- A pointer of the API that the mapper does not know is not lost: the user sees the
  toast. The unit tests of a mapper cover its pointers.
- Adding a field error code is a change of the `api` crate, of the contract and of the
  labels of the web app, in the same pull request; the build of the web app breaks when
  a code has no label.
- The schemas of the forms live in `model/`, on the values the user types; those of the
  responses live in `api/`, on the wire (ADR 0020). The two never share a schema.
