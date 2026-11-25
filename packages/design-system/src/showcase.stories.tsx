import type { Meta, StoryObj } from '@storybook/react-vite'
import { useGlobals } from 'storybook/preview-api'

import { Badge } from '@portflow/design-system/atoms/badge'
import { Button } from '@portflow/design-system/atoms/button'
import { Checkbox } from '@portflow/design-system/atoms/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@portflow/design-system/atoms/dialog'
import { Input } from '@portflow/design-system/atoms/input'
import { Label } from '@portflow/design-system/atoms/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@portflow/design-system/atoms/select'
import { Toaster } from '@portflow/design-system/atoms/sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@portflow/design-system/atoms/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@portflow/design-system/atoms/tooltip'
import {
  EmptyState,
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateTitle,
} from '@portflow/design-system/molecules/empty-state'
import {
  ErrorState,
  ErrorStateActions,
  ErrorStateMessage,
} from '@portflow/design-system/molecules/error-state'
import {
  LoadingState,
  LoadingStateLabel,
  LoadingStatePlaceholder,
} from '@portflow/design-system/molecules/loading-state'
import {
  ResponsiveTable,
  ResponsiveTableBody,
  ResponsiveTableCaption,
  ResponsiveTableCell,
  ResponsiveTableHead,
  ResponsiveTableHeader,
  ResponsiveTableRow,
} from '@portflow/design-system/molecules/responsive-table'
import { showUndoToast } from '@portflow/design-system/molecules/undo-toast'
import { DENSITIES, THEMES } from '@portflow/design-system/styles/constants'

/*
 * Every atom and molecule on one page, with a switch of theme and density that changes
 * the tokens without reloading: the reference the design system in Claude Design is
 * built from. The templates are full pages: see their own stories.
 */

const meta = {
  title: 'Showcase/Overview',
  parameters: { layout: 'fullscreen' },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

type TokenSwitchProps = {
  theme: string
  density: string
  onChange: (globals: { theme?: string; density?: string }) => void
}

function TokenSwitch({ theme, density, onChange }: TokenSwitchProps) {
  return (
    <div className="flex flex-wrap gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="showcase-theme">Theme</Label>
        <Select value={theme} onValueChange={(value) => onChange({ theme: value })}>
          <SelectTrigger id="showcase-theme" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {THEMES.map((value) => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="showcase-density">Density</Label>
        <Select value={density} onValueChange={(value) => onChange({ density: value })}>
          <SelectTrigger id="showcase-density" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DENSITIES.map((value) => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section aria-label={title} className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  )
}

export const Overview: Story = {
  render: function Render() {
    // The switch writes the globals of the toolbar: both stay in step.
    const [globals, updateGlobals] = useGlobals()
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 p-4">
        <Toaster />
        <h1 className="text-2xl font-semibold">Portflow design system</h1>
        <TokenSwitch theme={globals.theme} density={globals.density} onChange={updateGlobals} />

        <Section title="Buttons and badges">
          <div className="flex flex-wrap gap-2">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Delete</Button>
            <Button variant="link">Link</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>Open</Badge>
            <Badge variant="secondary">Planned</Badge>
            <Badge variant="destructive">Refused</Badge>
            <Badge variant="outline">Closed</Badge>
          </div>
        </Section>

        <Section title="Form controls">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="showcase-vessel">Vessel</Label>
              <Input id="showcase-vessel" placeholder="Name of the vessel" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="showcase-berth">Berth</Label>
              <Select>
                <SelectTrigger id="showcase-berth" className="w-full">
                  <SelectValue placeholder="Choose a berth" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="north">North quay</SelectItem>
                  <SelectItem value="south">South quay</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Label>
            <Checkbox /> Night shift
          </Label>
        </Section>

        <Section title="Overlays">
          <div className="flex flex-wrap gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Open a dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Close hold 3</DialogTitle>
                  <DialogDescription>No more weighings can be recorded on it.</DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline">Hover or focus me</Button>
              </TooltipTrigger>
              <TooltipContent>Export the weighings as a spreadsheet</TooltipContent>
            </Tooltip>
            <Button
              variant="outline"
              onClick={() =>
                showUndoToast({ message: 'Weighing deleted', undoLabel: 'Undo', onUndo: () => {} })
              }
            >
              Show an undo toast
            </Button>
          </div>
        </Section>

        <Section title="Tabs">
          <Tabs defaultValue="holds">
            <TabsList>
              <TabsTrigger value="holds">Holds</TabsTrigger>
              <TabsTrigger value="weighings">Weighings</TabsTrigger>
            </TabsList>
            <TabsContent value="holds">Three holds.</TabsContent>
            <TabsContent value="weighings">Twelve weighings.</TabsContent>
          </Tabs>
        </Section>

        <Section title="States">
          <LoadingState>
            <LoadingStateLabel>Loading…</LoadingStateLabel>
            <LoadingStatePlaceholder />
          </LoadingState>
          <EmptyState>
            <EmptyStateTitle>No vessel yet</EmptyStateTitle>
            <EmptyStateDescription>Vessels appear here once announced.</EmptyStateDescription>
            <EmptyStateActions>
              <Button>Announce a vessel</Button>
            </EmptyStateActions>
          </EmptyState>
          <ErrorState>
            <ErrorStateMessage>
              The service cannot be reached. Try again in a moment.
            </ErrorStateMessage>
            <ErrorStateActions>
              <Button variant="outline">Try again</Button>
            </ErrorStateActions>
          </ErrorState>
        </Section>

        <Section title="Responsive table">
          <ResponsiveTable>
            <ResponsiveTableCaption>Weighings of the day</ResponsiveTableCaption>
            <ResponsiveTableHeader>
              <ResponsiveTableRow>
                <ResponsiveTableHead>Truck</ResponsiveTableHead>
                <ResponsiveTableHead>Hold</ResponsiveTableHead>
                <ResponsiveTableHead>Net</ResponsiveTableHead>
              </ResponsiveTableRow>
            </ResponsiveTableHeader>
            <ResponsiveTableBody>
              <ResponsiveTableRow>
                <ResponsiveTableCell label="Truck">AB-123-CD</ResponsiveTableCell>
                <ResponsiveTableCell label="Hold">Hold 1</ResponsiveTableCell>
                <ResponsiveTableCell label="Net">28.4 t</ResponsiveTableCell>
              </ResponsiveTableRow>
              <ResponsiveTableRow>
                <ResponsiveTableCell label="Truck">EF-456-GH</ResponsiveTableCell>
                <ResponsiveTableCell label="Hold">Hold 2</ResponsiveTableCell>
                <ResponsiveTableCell label="Net">27.6 t</ResponsiveTableCell>
              </ResponsiveTableRow>
            </ResponsiveTableBody>
          </ResponsiveTable>
        </Section>
      </main>
    )
  },
}
