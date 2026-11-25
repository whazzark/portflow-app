import type { Decorator, Preview } from '@storybook/react-vite'
import { useEffect } from 'storybook/preview-api'

import { TooltipProvider } from '@portflow/design-system/atoms/tooltip'

import { DENSITIES, THEMES } from '../src/styles/constants'

import '../src/styles/storybook.css'

/**
 * Applies the theme and the density chosen in the toolbar to the whole document, as an
 * app does: the portals of dialogs, selects and toasts get them too. No reload.
 */
function withTokens(Story: Parameters<Decorator>[0], context: Parameters<Decorator>[1]) {
  const { theme, density } = context.globals
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.dataset.density = density
  }, [theme, density])
  return (
    <TooltipProvider>
      <Story />
    </TooltipProvider>
  )
}

const preview: Preview = {
  decorators: [withTokens],
  initialGlobals: { theme: 'light', density: 'office' },
  globalTypes: {
    theme: {
      description: 'Theme of the tokens',
      toolbar: {
        title: 'Theme',
        icon: 'contrast',
        items: THEMES.map((value) => ({ value, title: value })),
        dynamicTitle: true,
      },
    },
    density: {
      description: 'Density of the controls',
      toolbar: {
        title: 'Density',
        icon: 'component',
        items: DENSITIES.map((value) => ({ value, title: value })),
        dynamicTitle: true,
      },
    },
  },
  parameters: {
    layout: 'padded',
    a11y: { test: 'todo' },
    viewport: {
      options: {
        phone: { name: 'Phone (390px, below sm)', styles: { width: '390px', height: '844px' } },
        desktop: {
          name: 'Desktop (1280px, above lg)',
          styles: { width: '1280px', height: '800px' },
        },
      },
    },
  },
}

export default preview
