import { addDays, format, isValid, parse } from 'date-fns'
import type { DurationRange } from '../crops/types'

/** Fecha de calendario sin hora ni zona horaria, en formato `YYYY-MM-DD`. */
export type IsoDate = string

const ISO_DATE_FORMAT = 'yyyy-MM-dd'

export function parseIsoDate(value: IsoDate): Date {
  // `parse` interpreta la fecha en hora local; `new Date("YYYY-MM-DD")` la tomaría en UTC
  // y podría recorrerla un día.
  const date = parse(value, ISO_DATE_FORMAT, new Date())
  if (!isValid(date) || format(date, ISO_DATE_FORMAT) !== value) {
    throw new Error(`Fecha inválida: "${value}". Se esperaba el formato YYYY-MM-DD.`)
  }
  return date
}

export function shiftIsoDate(value: IsoDate, days: number): IsoDate {
  return format(addDays(parseIsoDate(value), days), ISO_DATE_FORMAT)
}

export function rangeInDays(range: DurationRange): { min: number; max: number } {
  const factor = range.unit === 'weeks' ? 7 : 1
  return { min: range.min * factor, max: range.max * factor }
}
