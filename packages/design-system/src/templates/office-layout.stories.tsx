import type { Meta, StoryObj } from '@storybook/react-vite'

import { Badge } from '@portflow/design-system/atoms/badge'
import { buttonVariants } from '@portflow/design-system/atoms/button'
import { Input } from '@portflow/design-system/atoms/input'
import { Label } from '@portflow/design-system/atoms/label'
import {
  ResponsiveTable,
  ResponsiveTableBody,
  ResponsiveTableCaption,
  ResponsiveTableCell,
  ResponsiveTableHead,
  ResponsiveTableHeader,
  ResponsiveTableRow,
} from '@portflow/design-system/atoms/responsive-table'
import {
  OfficeLayout,
  OfficeLayoutContent,
  OfficeLayoutNav,
  OfficeLayoutNavItem,
  OfficeLayoutNavList,
  OfficeLayoutNavTitle,
} from '@portflow/design-system/templates/office-layout'

const meta = {
  title: 'Templates/Office layout',
  component: OfficeLayout,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof OfficeLayout>

export default meta
type Story = StoryObj<typeof meta>

const SECTIONS = ['Vessels', 'Discharges', 'Weighings', 'Trucks', 'Reports', 'Settings']

const VESSELS = [
  { name: 'Atlantic Star', berth: 'North quay', status: 'Discharging' },
  { name: 'Baltic Dawn', berth: 'South quay', status: 'Announced' },
]

export const Default: Story = {
  render: (args) => (
    <OfficeLayout {...args}>
      <OfficeLayoutNav aria-label="Sections">
        <OfficeLayoutNavTitle>Portflow</OfficeLayoutNavTitle>
        <OfficeLayoutNavList>
          {SECTIONS.map((section, index) => (
            <OfficeLayoutNavItem key={section}>
              <a
                href={`#${section.toLowerCase()}`}
                aria-current={index === 0 ? 'page' : undefined}
                className={buttonVariants({
                  variant: index === 0 ? 'secondary' : 'ghost',
                  className: 'w-full justify-start',
                })}
              >
                {section}
              </a>
            </OfficeLayoutNavItem>
          ))}
        </OfficeLayoutNavList>
      </OfficeLayoutNav>
      <OfficeLayoutContent>
        <h1 className="text-2xl font-semibold">Vessels</h1>
        <div className="flex max-w-sm flex-col gap-2">
          <Label htmlFor="search">Search</Label>
          <Input id="search" placeholder="Name of the vessel" />
        </div>
        <ResponsiveTable>
          <ResponsiveTableCaption>Vessels of the week</ResponsiveTableCaption>
          <ResponsiveTableHeader>
            <ResponsiveTableRow>
              <ResponsiveTableHead>Vessel</ResponsiveTableHead>
              <ResponsiveTableHead>Berth</ResponsiveTableHead>
              <ResponsiveTableHead>Status</ResponsiveTableHead>
            </ResponsiveTableRow>
          </ResponsiveTableHeader>
          <ResponsiveTableBody>
            {VESSELS.map((vessel) => (
              <ResponsiveTableRow key={vessel.name}>
                <ResponsiveTableCell label="Vessel">{vessel.name}</ResponsiveTableCell>
                <ResponsiveTableCell label="Berth">{vessel.berth}</ResponsiveTableCell>
                <ResponsiveTableCell label="Status">
                  <Badge variant="secondary">{vessel.status}</Badge>
                </ResponsiveTableCell>
              </ResponsiveTableRow>
            ))}
          </ResponsiveTableBody>
        </ResponsiveTable>
      </OfficeLayoutContent>
    </OfficeLayout>
  ),
}
