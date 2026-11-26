import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, http, HttpResponse } from 'msw'
import createClient from 'openapi-fetch'
import { describe, expect, test, vi } from 'vitest'
import { z } from 'zod'

import { Toaster } from '@portflow/design-system/atoms/sonner'
import { useAppForm } from '@portflow/design-system/molecules/form'
import { showSuccessToast } from '@portflow/design-system/molecules/toasts'

import { unwrap } from '@/shared/api/client'
import { FIELD_ERROR_LABELS, PROBLEM_LABELS, UNREACHABLE_LABEL } from '@/shared/api/constants'
import { server } from '@/test/server'

import { showSubmitError } from './submit-error'

// A form of the tests, not a screen of the product: its endpoint, its schema, its mapper
// and its labels are examples of what a feature writes in its `model/` and `api/`.

const PATH = '/api/test-weighings'

type WeighingBody = { truck: string; grossWeightKg: number }

type TestPaths = {
  '/api/test-weighings': {
    post: {
      requestBody: { content: { 'application/json': WeighingBody } }
      responses: { 204: { content?: never } }
    }
  }
}

const client = createClient<TestPaths>({
  baseUrl: window.location.origin,
  fetch: (request) => globalThis.fetch(request),
})

const schema = z.object({
  truck: z.string().trim().min(1, 'Enter the plate of the truck'),
  tonnage: z
    .string()
    .trim()
    .min(1, 'Enter the gross weight')
    .transform(Number)
    .pipe(z.number({ error: 'Enter a number' }).positive('Enter a weight above zero')),
})

type Values = z.input<typeof schema>

function toBody(values: Values): WeighingBody {
  const { truck, tonnage } = schema.parse(values)
  return { truck, grossWeightKg: tonnage * 1000 }
}

const FIELD_OF_POINTER: Record<string, keyof Values> = {
  '/truck': 'truck',
  '/grossWeightKg': 'tonnage',
}

function fieldOf(pointer: string): keyof Values | undefined {
  return FIELD_OF_POINTER[pointer]
}

function WeighingForm() {
  const form = useAppForm({
    defaultValues: { truck: '', tonnage: '' } satisfies Values,
    validators: { onDynamic: schema },
    onSubmit: async ({ value, formApi }) => {
      try {
        await unwrap(client.POST(PATH, { body: toBody(value) }))
        showSuccessToast('Weighing recorded')
      } catch (error) {
        showSubmitError(formApi, error, fieldOf)
      }
    },
  })
  return (
    <form.AppForm>
      <form.Form aria-label="Weighing">
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
              <field.Label>Gross weight</field.Label>
              <field.NumberInput />
              <field.Error />
            </field.Field>
          )}
        </form.AppField>
        <form.SubmitButton>Record</form.SubmitButton>
      </form.Form>
    </form.AppForm>
  )
}

function problem(status: number, code: string, errors?: { pointer: string; code: string }[]) {
  return HttpResponse.json(
    { type: 'about:blank', title: 'Error', status, detail: 'For the developer', code, errors },
    { status, headers: { 'Content-Type': 'application/problem+json' } },
  )
}

async function fillAndRecord() {
  const user = userEvent.setup()
  render(
    <>
      <Toaster />
      <WeighingForm />
    </>,
  )
  const truck = screen.getByRole('textbox', { name: 'Truck' })
  const tonnage = screen.getByRole('textbox', { name: 'Gross weight' })
  const record = screen.getByRole('button', { name: 'Record' })
  await user.type(truck, 'AB-123-CD')
  await user.type(tonnage, '41.2')
  await user.click(record)
  return { user, truck, tonnage, record }
}

describe('a form', () => {
  test('shows an error of its schema under its field and sends nothing', async () => {
    let sent = false
    server.use(
      http.post(PATH, () => {
        sent = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    render(<WeighingForm />)

    await user.type(screen.getByRole('textbox', { name: 'Gross weight' }), 'heavy')
    await user.click(screen.getByRole('button', { name: 'Record' }))

    expect(screen.getByRole('textbox', { name: 'Gross weight' })).toHaveAccessibleDescription(
      'Enter a number',
    )
    expect(screen.getByRole('textbox', { name: 'Truck' })).toHaveAccessibleDescription(
      'Enter the plate of the truck',
    )
    expect(sent).toBe(false)
  })

  test('sends the body its mapper builds, and shows the success in a toast', async () => {
    let body: unknown
    server.use(
      http.post(PATH, async ({ request }) => {
        body = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )

    await fillAndRecord()

    expect(await screen.findByText('Weighing recorded')).toBeVisible()
    expect(body).toEqual({ truck: 'AB-123-CD', grossWeightKg: 41_200 })
  })

  test('shows the fields a 422 names under those fields, and keeps the values', async () => {
    server.use(
      http.post(PATH, () =>
        problem(422, 'VALIDATION_FAILED', [{ pointer: '/grossWeightKg', code: 'OUT_OF_RANGE' }]),
      ),
    )

    const { truck, tonnage } = await fillAndRecord()

    await vi.waitFor(() =>
      expect(tonnage).toHaveAccessibleDescription(FIELD_ERROR_LABELS.OUT_OF_RANGE),
    )
    expect(truck).toBeValid()
    expect(truck).toHaveValue('AB-123-CD')
    expect(tonnage).toHaveValue('41.2')
    expect(screen.queryByText(PROBLEM_LABELS.VALIDATION_FAILED)).not.toBeInTheDocument()
  })

  test('shows a 422 whose pointer names no field of the form in a toast', async () => {
    server.use(
      http.post(PATH, () =>
        problem(422, 'VALIDATION_FAILED', [{ pointer: '/berth', code: 'REQUIRED' }]),
      ),
    )

    const { truck, tonnage } = await fillAndRecord()

    expect(await screen.findByText(PROBLEM_LABELS.VALIDATION_FAILED)).toBeVisible()
    expect(truck).toBeValid()
    expect(tonnage).toBeValid()
  })

  test('shows a 422 that names no field in a toast with the label of its code', async () => {
    server.use(http.post(PATH, () => problem(422, 'INVALID_REQUEST')))

    await fillAndRecord()

    expect(await screen.findByText(PROBLEM_LABELS.INVALID_REQUEST)).toBeVisible()
  })

  test('shows another error of the API in a toast with the label of its code', async () => {
    server.use(http.post(PATH, () => problem(500, 'INTERNAL_ERROR')))

    const { tonnage } = await fillAndRecord()

    expect(await screen.findByText(PROBLEM_LABELS.INTERNAL_ERROR)).toBeVisible()
    expect(tonnage).toHaveValue('41.2')
  })

  test('shows an API that cannot be reached in a toast', async () => {
    server.use(http.post(PATH, () => HttpResponse.error()))

    await fillAndRecord()

    expect(await screen.findByText(UNREACHABLE_LABEL)).toBeVisible()
  })

  test('cannot be sent twice while its request runs', async () => {
    let requests = 0
    server.use(
      http.post(PATH, async () => {
        requests += 1
        await delay(100)
        return new HttpResponse(null, { status: 204 })
      }),
    )

    const { user, record } = await fillAndRecord()
    expect(record).toBeDisabled()
    expect(record).toHaveAttribute('aria-busy', 'true')
    await user.click(record)

    await vi.waitFor(() => expect(record).toBeEnabled())
    expect(requests).toBe(1)
  })
})
