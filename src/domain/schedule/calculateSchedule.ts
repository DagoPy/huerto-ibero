import type { Crop, PropagationMethod } from '../crops/types'
import { parseIsoDate, rangeInDays, shiftIsoDate, type IsoDate } from './dates'

export type StageId =
  | 'flat1-sowing' // Siembra en almácigo 1
  | 'flat2-pricking-out' // Repique del almácigo 1 al almácigo 2
  | 'bed-transplant' // Trasplante a la cama de siembra (fecha ancla)
  | 'bed-direct-sowing' // Siembra directa en la cama (fecha ancla)

/** Ventana de fechas en la que conviene realizar una etapa. */
export interface DateWindow {
  earliest: IsoDate
  latest: IsoDate
}

export interface ScheduleStage {
  id: StageId
  window: DateWindow
}

export type ScheduleWarning = {
  code: 'flat-duration-not-given'
  flat: 'flat1' | 'flat2'
  bookValue: string
}

export interface CropSchedule {
  cropId: string
  method: PropagationMethod
  anchorDate: IsoDate
  /** Ordenadas cronológicamente. */
  stages: ScheduleStage[]
  warnings: ScheduleWarning[]
}

export interface ScheduleOptions {
  /** Por defecto, el primer método del cultivo. */
  method?: PropagationMethod
}

/**
 * Calcula el calendario de un cultivo a partir de la fecha ancla: la fecha de trasplante a
 * la cama (o la de siembra directa, si el cultivo va directo a la cama).
 *
 * Las etapas previas se calculan restando a la fecha ancla los tiempos en almácigo del
 * libro. Como el libro da rangos (p. ej. 3-4 semanas), cada etapa es una ventana:
 * `earliest` usa el tiempo máximo y `latest` el mínimo.
 */
export function calculateSchedule(
  crop: Crop,
  anchorDate: IsoDate,
  options: ScheduleOptions = {},
): CropSchedule {
  parseIsoDate(anchorDate)

  const method = options.method ?? crop.methods[0]
  if (!crop.methods.includes(method)) {
    throw new Error(`El cultivo "${crop.id}" no admite el método "${method}".`)
  }

  const schedule: CropSchedule = {
    cropId: crop.id,
    method,
    anchorDate,
    stages: [],
    warnings: [],
  }
  const anchorWindow: DateWindow = { earliest: anchorDate, latest: anchorDate }

  if (method === 'direct') {
    schedule.stages.push({ id: 'bed-direct-sowing', window: anchorWindow })
    return schedule
  }

  const flats = [
    { key: 'flat1' as const, duration: crop.flat1 },
    { key: 'flat2' as const, duration: crop.flat2 },
  ].filter((flat) => flat.duration !== null)

  for (const { key, duration } of flats) {
    if (duration?.range === null) {
      schedule.warnings.push({ code: 'flat-duration-not-given', flat: key, bookValue: duration.bookValue })
    }
  }

  if (schedule.warnings.length === 0) {
    const flat1 = crop.flat1?.range ? rangeInDays(crop.flat1.range) : { min: 0, max: 0 }
    const flat2 = crop.flat2?.range ? rangeInDays(crop.flat2.range) : null

    const daysBeforeAnchor = {
      min: flat1.min + (flat2?.min ?? 0),
      max: flat1.max + (flat2?.max ?? 0),
    }
    schedule.stages.push({
      id: 'flat1-sowing',
      window: {
        earliest: shiftIsoDate(anchorDate, -daysBeforeAnchor.max),
        latest: shiftIsoDate(anchorDate, -daysBeforeAnchor.min),
      },
    })

    if (flat2) {
      schedule.stages.push({
        id: 'flat2-pricking-out',
        window: {
          earliest: shiftIsoDate(anchorDate, -flat2.max),
          latest: shiftIsoDate(anchorDate, -flat2.min),
        },
      })
    }
  }

  schedule.stages.push({ id: 'bed-transplant', window: anchorWindow })
  return schedule
}
