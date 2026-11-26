import type { Meta, StoryObj } from '@storybook/react-vite'

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@portflow/design-system/atoms/table'

const meta = {
  title: 'Atoms/Table',
  component: Table,
} satisfies Meta<typeof Table>

export default meta
type Story = StoryObj<typeof meta>

const HOLDS = [
  { name: 'Hold 1', product: 'Wheat', tonnage: '4,210 t' },
  { name: 'Hold 2', product: 'Barley', tonnage: '3,980 t' },
  { name: 'Hold 3', product: 'Wheat', tonnage: '4,005 t' },
]

export const Default: Story = {
  render: (args) => (
    <Table {...args}>
      <TableCaption>Holds of the vessel</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Hold</TableHead>
          <TableHead>Product</TableHead>
          <TableHead className="text-right">Tonnage</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {HOLDS.map((hold) => (
          <TableRow key={hold.name}>
            <TableHead scope="row">{hold.name}</TableHead>
            <TableCell>{hold.product}</TableCell>
            <TableCell className="text-right">{hold.tonnage}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
}
