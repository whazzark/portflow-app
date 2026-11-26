import type { Meta, StoryObj } from '@storybook/react-vite'

import {
  ResponsiveTable,
  ResponsiveTableBody,
  ResponsiveTableCaption,
  ResponsiveTableCell,
  ResponsiveTableHead,
  ResponsiveTableHeader,
  ResponsiveTableRow,
} from '@portflow/design-system/atoms/responsive-table'

const meta = {
  title: 'Atoms/Responsive table',
  component: ResponsiveTable,
} satisfies Meta<typeof ResponsiveTable>

export default meta
type Story = StoryObj<typeof meta>

const COLUMNS = ['Truck', 'Hold', 'Gross', 'Tare', 'Net', 'Recorded at'] as const

const WEIGHINGS = [
  ['AB-123-CD', 'Hold 1', '41.2 t', '12.8 t', '28.4 t', '08:12'],
  ['EF-456-GH', 'Hold 1', '40.7 t', '13.1 t', '27.6 t', '08:31'],
  ['IJ-789-KL', 'Hold 2', '42.0 t', '12.9 t', '29.1 t', '08:47'],
]

/** One card per row below `md`; resize the viewport to the phone to see it. */
export const Default: Story = {
  render: (args) => (
    <ResponsiveTable {...args}>
      <ResponsiveTableCaption>Weighings of the day</ResponsiveTableCaption>
      <ResponsiveTableHeader>
        <ResponsiveTableRow>
          {COLUMNS.map((column) => (
            <ResponsiveTableHead key={column}>{column}</ResponsiveTableHead>
          ))}
        </ResponsiveTableRow>
      </ResponsiveTableHeader>
      <ResponsiveTableBody>
        {WEIGHINGS.map((weighing) => (
          <ResponsiveTableRow key={weighing[0]}>
            {weighing.map((value, index) => (
              <ResponsiveTableCell key={COLUMNS[index]} label={COLUMNS[index] ?? ''}>
                {value}
              </ResponsiveTableCell>
            ))}
          </ResponsiveTableRow>
        ))}
      </ResponsiveTableBody>
    </ResponsiveTable>
  ),
}
