import { addDays, addWeeks, addYears, format, isValid, parse } from 'date-fns'
import type { DurationUnit } from '../crops/types'

/** Fecha de calendario sin hora ni zona horaria, en formato `YYYY-MM-DD`. */
export type IsoDate = string

export interface Duration {
  amount: number
  unit: DurationUnit
}

const ISO_DATE_FORMAT = 'yyyy-MM-dd'

const adders = { days: addDays, weeks: addWeeks, years: addYears }

export function parseIsoDate(value: IsoDate): Date {
  // `parse` interpreta la fecha en hora local; `new Date("YYYY-MM-DD")` la tomaría en UTC
  // y podría recorrerla un día.
  const date = parse(value, ISO_DATE_FORMAT, new Date())
  if (!isValid(date) || format(date, ISO_DATE_FORMAT) !== value) {
    throw new Error(`Fecha inválida: "${value}". Se esperaba el formato YYYY-MM-DD.`)
  }
  return date
}

/**
 * Suma (`direction = 1`) o resta (`direction = -1`) una serie de duraciones a una fecha.
 * Los años se suman como años de calendario, no como 365 días.
 */
export function shiftIsoDate(value: IsoDate, durations: Duration[], direction: 1 | -1): IsoDate {
  const date = durations.reduce(
    (current, { amount, unit }) => adders[unit](current, amount * direction),
    parseIsoDate(value),
  )
  return format(date, ISO_DATE_FORMAT)
}
