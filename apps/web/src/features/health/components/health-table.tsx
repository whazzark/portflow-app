import { HEALTH_LABELS } from '../constants'
import type { HealthStatus } from '../model/health'

interface HealthTableProps {
  status: HealthStatus
}

/** Whether each component of the service is up. */
export function HealthTable({ status }: HealthTableProps) {
  const rows = [
    { name: HEALTH_LABELS.service, up: status.serviceUp },
    { name: HEALTH_LABELS.database, up: status.databaseUp },
  ]

  return (
    <table className="w-full text-left">
      <caption className="sr-only">{HEALTH_LABELS.components}</caption>
      <tbody>
        {rows.map((row) => (
          <tr key={row.name} className="border-b last:border-b-0">
            <th scope="row" className="py-2 pr-4 font-medium">
              {row.name}
            </th>
            <td className="py-2">{row.up ? HEALTH_LABELS.up : HEALTH_LABELS.down}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
