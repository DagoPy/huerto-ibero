/*
 * Línea de tiempo del planeador: traduce el calendario que calcula domain/ a barras sobre un
 * eje de meses. No calcula fechas agronómicas nuevas; solo acomoda las ventanas de las etapas.
 */
import { addDays, addMonths, differenceInCalendarDays, endOfMonth, format, startOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Crop } from '../../../domain/crops/types'
import type { CropSchedule, ScheduleStage } from '../../../domain/schedule/calculateSchedule'
import { parseIsoDate, type IsoDate } from '../../../domain/schedule/dates'

export type BarKind = 'flat' | 'pricking' | 'bed' | 'harvest'

export interface TimelineBar {
  kind: BarKind
  /** Nombre completo ("Almácigo 2") y corto ("A2") para cuando no cabe. */
  label: string
  shortLabel: string
  from: IsoDate
  /** Exclusivo: la barra termina donde empieza la siguiente. */
  to: IsoDate
}

export interface CropTimeline {
  bars: TimelineBar[]
  anchor: IsoDate
  /** El libro no da el tiempo de algún almácigo / de la cosecha ("Sin dato"). */
  missingBefore: boolean
  missingAfter: boolean
  earliest: IsoDate
  latest: IsoDate
}

const isFlat = (s: ScheduleStage) => s.id === 'flat-sowing' || s.id === 'flat-pricking-out'

/**
 * Barras seguidas, sin encimarse. Cada una abarca el periodo más amplio posible según el libro:
 * - Cada almácigo va del inicio más temprano de su ventana al de la etapa siguiente.
 * - "En la cama" va del ancla al inicio más temprano de la cosecha.
 * - La cosecha va del inicio más temprano al fin más tardío (o al inicio más tardío, si es
 *   una sola cosecha).
 * La etapa de endurecer (2 días) no se dibuja: es parte del último almácigo.
 */
export function buildCropTimeline(crop: Crop, schedule: CropSchedule): CropTimeline {
  const { stages, anchorDate } = schedule
  const flats = stages.filter(isFlat)
  const harvestStart = stages.find((s) => s.id === 'harvest-start')
  const harvestEnd = stages.find((s) => s.id === 'harvest-end')
  const bars: TimelineBar[] = []

  flats.forEach((stage, index) => {
    const number = stage.flatNumber ?? 1
    bars.push({
      kind: index === 0 ? 'flat' : 'pricking',
      label: `Almácigo ${number}`,
      shortLabel: `A${number}`,
      from: stage.window.earliest,
      to: flats[index + 1]?.window.earliest ?? anchorDate,
    })
  })

  if (harvestStart) {
    bars.push({
      kind: 'bed',
      label: 'En la cama',
      shortLabel: 'Cama',
      from: anchorDate,
      to: harvestStart.window.earliest,
    })
    const harvestLatest =
      harvestEnd?.window.latest ?? (crop.harvestPeriod === null ? harvestStart.window.latest : null)
    if (harvestLatest) {
      bars.push({
        kind: 'harvest',
        label: 'Cosecha',
        shortLabel: 'Cos.',
        from: harvestStart.window.earliest,
        to: harvestLatest,
      })
    }
  }

  const fields = schedule.warnings.map((w) => w.field)
  const dates = stages.flatMap((s) => [s.window.earliest, s.window.latest])
  return {
    bars,
    anchor: anchorDate,
    missingBefore: fields.includes('flat'),
    missingAfter: fields.includes('maturity') || fields.includes('harvest-period'),
    earliest: dates.reduce((a, b) => (a < b ? a : b)),
    latest: dates.reduce((a, b) => (a > b ? a : b)),
  }
}

/* Escala de tiempo */

export interface TimeScale {
  start: IsoDate
  /** Exclusivo. */
  end: IsoDate
  days: number
}

const toIso = (date: Date): IsoDate => format(date, 'yyyy-MM-dd')

/** Meses completos: del primer día del mes de `from` al último del mes de `to`. */
export function monthScale(from: IsoDate, to: IsoDate): TimeScale {
  const start = startOfMonth(parseIsoDate(from))
  const end = addDays(endOfMonth(parseIsoDate(to)), 1)
  return { start: toIso(start), end: toIso(end), days: differenceInCalendarDays(end, start) }
}

/** Posición en % dentro de la escala, recortada a 0..100. */
export function percentOf(date: IsoDate, scale: TimeScale): number {
  const days = differenceInCalendarDays(parseIsoDate(date), parseIsoDate(scale.start))
  return Math.min(100, Math.max(0, (days / scale.days) * 100))
}

export function isInScale(date: IsoDate, scale: TimeScale): boolean {
  return date >= scale.start && date < scale.end
}

export interface MonthColumn {
  date: IsoDate
  /** "mar", o "ene 27" en la primera columna y cuando cambia el año. */
  label: string
  /** "M" (para pantallas angostas). */
  initial: string
  left: number
  width: number
}

/** Planes muy largos (p. ej. ruibarbo, años) agrupan varios meses por columna. */
const MAX_COLUMNS = 14

export function monthColumns(scale: TimeScale): MonthColumn[] {
  const end = parseIsoDate(scale.end)
  const months: Date[] = []
  for (let month = parseIsoDate(scale.start); month < end; month = addMonths(month, 1)) {
    months.push(month)
  }
  const step = Math.ceil(months.length / MAX_COLUMNS)
  const starts = months.filter((_, index) => index % step === 0)
  return starts.map((month, index) => {
    const name = format(month, 'LLL', { locale: es }).replace('.', '')
    const left = percentOf(toIso(month), scale)
    const next = starts[index + 1]
    return {
      date: toIso(month),
      // El año aparece en la primera columna y cada vez que cambia.
      label:
        index === 0 || month.getFullYear() !== starts[index - 1].getFullYear()
          ? `${name} ${format(month, 'yy')}`
          : name,
      initial: name.charAt(0).toUpperCase(),
      left,
      width: (next ? percentOf(toIso(next), scale) : 100) - left,
    }
  })
}
