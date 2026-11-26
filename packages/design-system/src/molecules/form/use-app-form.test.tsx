import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { z } from 'zod'

import { useAppForm } from '@portflow/design-system/molecules/form/use-app-form'

// A form of the tests: its labels are examples, not labels of the product.
const schema = z.object({
  name: z.string().trim().min(1, 'Enter a name'),
  tonnage: z
    .string()
    .trim()
    .min(1, 'Enter a tonnage')
    .transform(Number)
    .pipe(z.number({ error: 'Enter a number' }).positive('Enter a tonnage above zero')),
})

type Values = z.input<typeof schema>

/** What the test reads of the form when it is submitted. */
type SubmittedForm = {
  value: Values
  formApi: { setErrorMap: (map: object) => void }
}

type SubmitHandler = (form: SubmittedForm) => unknown

type TestFormProps = { onSubmit: SubmitHandler }

function TestForm({ onSubmit }: TestFormProps) {
  const form = useAppForm({
    defaultValues: { name: '', tonnage: '' } satisfies Values,
    validators: { onDynamic: schema },
    onSubmit,
  })

  return (
    <form.AppForm>
      <form.Form aria-label="Weighing">
        <form.AppField name="name">
          {(field) => (
            <field.Field>
              <field.Label>Name</field.Label>
              <field.TextInput />
              <field.Error />
            </field.Field>
          )}
        </form.AppField>
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
  )
}

function renderForm(onSubmit: SubmitHandler = () => {}) {
  render(<TestForm onSubmit={onSubmit} />)

  return {
    name: screen.getByRole('textbox', { name: 'Name' }),
    tonnage: screen.getByRole('textbox', { name: 'Tonnage' }),
    save: screen.getByRole('button', { name: 'Save' }),
  }
}

test('each input is named by its label; a number input asks for a decimal keyboard', () => {
  const { tonnage } = renderForm()

  expect(tonnage).toHaveAttribute('inputmode', 'decimal')
})

test('an error of the schema shows under its field once the field loses the focus', async () => {
  const user = userEvent.setup()
  const { name, tonnage } = renderForm()

  await user.click(name)
  expect(screen.queryByText('Enter a name')).not.toBeInTheDocument()
  await user.click(tonnage)

  expect(name).toHaveAccessibleDescription('Enter a name')
  expect(name).toBeInvalid()
  // The tonnage has not lost the focus yet: its error does not show.
  expect(tonnage).not.toHaveAccessibleDescription()
  expect(tonnage).toBeValid()
})

test('an error goes away as soon as the field is corrected', async () => {
  const user = userEvent.setup()
  const { name, tonnage } = renderForm()

  await user.type(tonnage, 'abc')
  await user.tab()
  expect(tonnage).toHaveAccessibleDescription('Enter a number')

  await user.clear(tonnage)
  await user.type(tonnage, '12.5')

  expect(tonnage).not.toHaveAccessibleDescription()
  expect(tonnage).toBeValid()
  expect(name).toBeValid()
})

test('submitting shows the errors of every field and sends nothing', async () => {
  const user = userEvent.setup()
  const onSubmit = vi.fn<SubmitHandler>()
  const { name, tonnage, save } = renderForm(onSubmit)

  await user.click(save)

  expect(name).toHaveAccessibleDescription('Enter a name')
  expect(tonnage).toHaveAccessibleDescription('Enter a tonnage')
  expect(onSubmit).not.toHaveBeenCalled()
})

test('the submit button cannot be pressed again while the form is sent', async () => {
  const user = userEvent.setup()
  let resolve: (() => void) | undefined
  const sent = new Promise<void>((done) => {
    resolve = done
  })
  const onSubmit = vi.fn<SubmitHandler>(() => sent)
  const { name, tonnage, save } = renderForm(onSubmit)
  await user.type(name, 'Hold 1')
  await user.type(tonnage, '12')

  await user.click(save)
  expect(save).toBeDisabled()
  expect(save).toHaveAttribute('aria-busy', 'true')
  await user.click(save)

  resolve?.()
  await vi.waitFor(() => expect(save).toBeEnabled())
  expect(onSubmit).toHaveBeenCalledOnce()
  expect(onSubmit.mock.calls[0]?.[0].value).toEqual({ name: 'Hold 1', tonnage: '12' })
})

test('an error set by the server shows under its field, keeps the values, and goes away when the field changes', async () => {
  const user = userEvent.setup()
  const { name, tonnage, save } = renderForm(({ formApi }) => {
    formApi.setErrorMap({ onServer: { fields: { tonnage: 'This value is out of range.' } } })
  })
  await user.type(name, 'Hold 1')
  await user.type(tonnage, '9999')

  await user.click(save)

  expect(tonnage).toHaveAccessibleDescription('This value is out of range.')
  expect(name).toHaveValue('Hold 1')
  expect(tonnage).toHaveValue('9999')

  await user.type(tonnage, '{Backspace}')
  expect(tonnage).not.toHaveAccessibleDescription()
  expect(tonnage).toBeValid()
})
