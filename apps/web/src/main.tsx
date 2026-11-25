import { QueryClient } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from '@/app/app'
import { createAppRouter } from '@/app/router'

import '@/shared/styles/index.css'

const queryClient = new QueryClient()
const router = createAppRouter(queryClient)

const root = document.getElementById('root')
if (root === null) throw new Error('index.html has no #root element')

createRoot(root).render(
  <StrictMode>
    <App queryClient={queryClient} router={router} />
  </StrictMode>,
)
