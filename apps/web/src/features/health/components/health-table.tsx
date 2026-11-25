import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableRow,
} from '@portflow/design-system/atoms/table'

import { HEALTH_LABELS } from '../constants'
import type { HealthStatus } from '../model/health'

type HealthTableProps = {
  status: HealthStatus
}

/** Whether each component of the service is up. */
export function HealthTable({ status }: HealthTableProps) {
  return (
    <Table>
      <TableCaption className="sr-only">{HEALTH_LABELS.components}</TableCaption>
      <TableBody>
        <HealthRow name={HEALTH_LABELS.service} up={status.serviceUp} />
        <HealthRow name={HEALTH_LABELS.database} up={status.databaseUp} />
      </TableBody>
    </Table>
  )
}

type HealthRowProps = {
  name: string
  up: boolean
}

/** One component of the service and whether it is up. */
function HealthRow({ name, up }: HealthRowProps) {
  return (
    <TableRow>
      <TableHead scope="row">{name}</TableHead>
      <TableCell>{up ? HEALTH_LABELS.up : HEALTH_LABELS.down}</TableCell>
    </TableRow>
  )
}
