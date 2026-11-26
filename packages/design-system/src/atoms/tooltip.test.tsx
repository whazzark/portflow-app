import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'

import { Button } from '@portflow/design-system/atoms/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@portflow/design-system/atoms/tooltip'

test('a tooltip shows when its trigger gets the focus, and hides with Escape', async () => {
  render(
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button>Export</Button>
        </TooltipTrigger>
        <TooltipContent>Export the weighings as a spreadsheet</TooltipContent>
      </Tooltip>
    </TooltipProvider>,
  )

  await userEvent.tab()
  expect(await screen.findByRole('tooltip')).toHaveTextContent(
    'Export the weighings as a spreadsheet',
  )
  await userEvent.keyboard('{Escape}')
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
})
