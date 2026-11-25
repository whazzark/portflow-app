import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, test } from 'vitest'

import { PAGE_LABELS } from '@/shared/lib/constants'
import { renderApp } from '@/test/render-app'
import { server } from '@/test/server'

describe('a path that matches no route', () => {
  test('says that the page does not exist and leads back home', async () => {
    server.use(http.get('/api/health', () => HttpResponse.json({ status: 'up', database: 'up' })))

    renderApp('/nowhere')

    expect(await screen.findByRole('heading', { name: PAGE_LABELS.notFound })).toBeVisible()
    await userEvent.click(screen.getByRole('link', { name: PAGE_LABELS.home }))
    expect(await screen.findByRole('table')).toBeVisible()
  })
})
