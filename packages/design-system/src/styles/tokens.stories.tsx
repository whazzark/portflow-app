import type { Meta, StoryObj } from '@storybook/react-vite'

import { cn } from '@portflow/design-system/lib/utils'
import {
  DENSITIES,
  type Density,
  RADIUS_ROLES,
  SHADOW_ROLES,
  type Theme,
  THEMES,
  TYPE_ROLES,
} from '@portflow/design-system/styles/constants'

const meta = {
  title: 'Styles/Tokens',
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

// The classes are written whole, so that Tailwind finds them in this file.
const TYPE_CLASS: Record<(typeof TYPE_ROLES)[number], string> = {
  'page-title': 'text-page-title',
  'task-title': 'text-task-title',
  'section-title': 'text-section-title',
  body: 'text-body',
  control: 'text-control',
  label: 'text-label',
  caption: 'text-caption',
  badge: 'text-badge',
}

const RADIUS_CLASS: Record<(typeof RADIUS_ROLES)[number], string> = {
  control: 'rounded-control',
  item: 'rounded-item',
  overlay: 'rounded-overlay',
  card: 'rounded-card',
  pill: 'rounded-pill',
}

const SHADOW_CLASS: Record<(typeof SHADOW_ROLES)[number], string> = {
  control: 'shadow-control',
  raised: 'shadow-raised',
  overlay: 'shadow-overlay',
  dialog: 'shadow-dialog',
}

type PanelProps = Readonly<{ theme: Theme; density: Density }>

function Panel({ theme, density }: PanelProps) {
  return (
    <section
      data-theme={theme}
      data-density={density}
      aria-label={`${theme} theme, ${density} density`}
      className="flex min-w-0 flex-col gap-4 rounded-card border bg-background p-4 text-text"
    >
      <h2 className="text-caption text-text-muted">
        {theme} theme, {density} density
      </h2>
      <div className="flex flex-col gap-1">
        {TYPE_ROLES.map((role) => (
          <p key={role} className={TYPE_CLASS[role]}>
            text-{role}
          </p>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        {RADIUS_ROLES.map((role) => (
          <div
            key={role}
            className={cn(
              'flex h-control items-center border border-border-strong bg-surface-muted px-control-x text-caption',
              RADIUS_CLASS[role],
            )}
          >
            rounded-{role}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-4">
        {SHADOW_ROLES.map((role) => (
          <div
            key={role}
            className={cn(
              'flex h-control items-center rounded-control bg-surface px-control-x text-caption',
              SHADOW_CLASS[role],
            )}
          >
            shadow-{role}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-control bg-info px-control-x py-1 text-body text-info-foreground">
          bg-info, text-info-foreground
        </span>
        <span className="text-body text-info">text-info on the page</span>
      </div>
    </section>
  )
}

/** Every semantic type, radius and shadow token and the info colour, in each theme and density. */
export const Semantic: Story = {
  render: () => (
    <div className="grid gap-4 lg:grid-cols-2">
      {THEMES.flatMap((theme) =>
        DENSITIES.map((density) => (
          <Panel key={`${theme}-${density}`} theme={theme} density={density} />
        )),
      )}
    </div>
  ),
}
