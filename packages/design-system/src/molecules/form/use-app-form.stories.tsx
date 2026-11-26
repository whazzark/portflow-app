import type { Meta, StoryObj } from '@storybook/react-vite'
import { z } from 'zod'

import { Toaster } from '@portflow/design-system/atoms/sonner'
import { showSuccessToast } from '@portflow/design-system/atoms/toasts'
import { useAppForm } from '@portflow/design-system/molecules/form/use-app-form'

// The labels are examples: the labels of a screen come from its approved mock-up.
const schema = z.object({
  truck: z.string().trim().min(1, 'Enter the plate of the truck'),
  tonnage: z
    .string()
    .trim()
    .min(1, 'Enter the gross weight')
    .transform(Number)
    .pipe(z.number({ error: 'Enter a number' }).positive('Enter a weight above zero')),
})

type WeighingValues = z.input<typeof schema>

function WeighingForm() {
  const form = useAppForm({
    defaultValues: { truck: '', tonnage: '' } satisfies WeighingValues,
    validators: { onDynamic: schema },
    onSubmit: async () => {
      await new Promise((done) => setTimeout(done, 1500))
      showSuccessToast('Weighing recorded')
    },
  })

  return (
    <form.AppForm>
      <form.Form aria-label="Weighing" className="max-w-sm">
        <form.AppField name="truck">
          {(field) => (
            <field.Field>
              <field.Label>Truck</field.Label>
              <field.TextInput />
              <field.Error />
            </field.Field>
          )}
        </form.AppField>
        <form.AppField name="tonnage">
          {(field) => (
            <field.Field>
              <field.Label>Gross weight (t)</field.Label>
              <field.NumberInput />
              <field.Error />
            </field.Field>
          )}
        </form.AppField>
        <form.SubmitButton className="self-start">Record</form.SubmitButton>
      </form.Form>
    </form.AppForm>
  )
}

const meta = {
  title: 'Molecules/Form',
  component: WeighingForm,
} satisfies Meta<typeof WeighingForm>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <>
      <Toaster />
      <WeighingForm />
    </>
  ),
}
