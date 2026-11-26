import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, http, HttpResponse } from 'msw'
import { describe, expect, test } from 'vitest'

import { PROBLEM_LABELS, UNREACHABLE_LABEL } from '@/shared/api/constants'
import { PAGE_LABELS } from '@/shared/lib/constants'
import { renderApp } from '@/test/render-app'
import { server } from '@/test/server'

import { HEALTH_LABELS } from './constants'

const HEALTH_PATH = '/api/health'

const UP = { status: 'up', database: 'up' }

const DATABASE_UNAVAILABLE = {
  type: 'about:blank',
  title: 'Service Unavailable',
  status: 503,
  detail: 'The database does not answer',
  code: 'DATABASE_UNAVAILABLE',
}

describe('the health page', () => {
  test('shows that the service and its database are up', async () => {
    server.use(http.get(HEALTH_PATH, () => HttpResponse.json(UP)))

    renderApp('/')

    const table = await screen.findByRole('table', { name: HEALTH_LABELS.components })
    expect(
      within(table).getByRole('row', { name: `${HEALTH_LABELS.service} ${HEALTH_LABELS.up}` }),
    ).toBeVisible()
    expect(
      within(table).getByRole('row', { name: `${HEALTH_LABELS.database} ${HEALTH_LABELS.up}` }),
    ).toBeVisible()
  })

  test('says that it is checking while the API has not answered', async () => {
    server.use(
      http.get(HEALTH_PATH, async () => {
        await delay('infinite')
        return HttpResponse.json(UP)
      }),
    )

    renderApp('/')

    expect(await screen.findByRole('status')).toHaveTextContent(PAGE_LABELS.loading)
  })

  test('shows the error the API answered, and shows the health once tried again', async () => {
    server.use(
      http.get(HEALTH_PATH, () => HttpResponse.json(DATABASE_UNAVAILABLE, { status: 503 }), {
        once: true,
      }),
      http.get(HEALTH_PATH, () => HttpResponse.json(UP)),
    )

    renderApp('/')

    expect(await screen.findByRole('alert')).toHaveTextContent(PROBLEM_LABELS.DATABASE_UNAVAILABLE)
    await userEvent.click(screen.getByRole('button', { name: PAGE_LABELS.retry }))
    expect(await screen.findByRole('table', { name: HEALTH_LABELS.components })).toBeVisible()
  })

  test('says that something went wrong when the error does not come from the API', async () => {
    // A success without a body: the schema of the response refuses it.
    server.use(http.get(HEALTH_PATH, () => new HttpResponse(null, { status: 200 })))

    renderApp('/')

    expect(await screen.findByRole('alert')).toHaveTextContent(PAGE_LABELS.unexpectedError)
  })

  test('says that something went wrong when the response does not match its schema', async () => {
    server.use(
      http.get(HEALTH_PATH, () => HttpResponse.json({ status: 'degraded', database: 'up' })),
    )

    renderApp('/')

    expect(await screen.findByRole('alert')).toHaveTextContent(PAGE_LABELS.unexpectedError)
  })

  test('says that the service cannot be reached when the network fails', async () => {
    server.use(http.get(HEALTH_PATH, () => HttpResponse.error()))

    renderApp('/')

    expect(await screen.findByRole('alert')).toHaveTextContent(UNREACHABLE_LABEL)
  })
})
