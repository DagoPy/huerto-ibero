import { format } from 'date-fns'
import type { DateWindow } from '../domain/schedule/calculateSchedule'
import { parseIsoDate, type IsoDate } from '../domain/schedule/dates'

/** Formato corto `dd/mm/aa`, p. ej. "01/05/27". */
export function formatDate(value: IsoDate): string {
  return format(parseIsoDate(value), 'dd/MM/yy')
}

/** Una fecha si la ventana es de un solo día; si no, "desde – hasta". */
export function formatWindow({ earliest, latest }: DateWindow): string {
  return earliest === latest ? formatDate(earliest) : `${formatDate(earliest)} – ${formatDate(latest)}`
}
