import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { parseIsoDate, type IsoDate } from '../domain/schedule/dates'

export function formatDate(value: IsoDate): string {
  return format(parseIsoDate(value), "EEE d 'de' MMM yyyy", { locale: es })
}
