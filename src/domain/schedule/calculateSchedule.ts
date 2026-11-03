import type {
  BookDuration,
  Crop,
  DurationRange,
  GrowingCondition,
  PropagationMethod,
} from '../crops/types'
import { parseIsoDate, shiftIsoDate, type Duration, type IsoDate } from './dates'

export type StageId =
  | 'flat-sowing' // Siembra en el almácigo 1
  | 'flat-pricking-out' // Repique al siguiente almácigo (2, 3...)
  | 'flat-hardening' // Endurecer el almácigo a la intemperie antes del trasplante (código #)
  | 'bed-transplant' // Trasplante a la cama de siembra (fecha ancla)
  | 'bed-direct-sowing' // Siembra directa en la cama (fecha ancla)
  | 'harvest-start' // Inicio de cosecha
  | 'harvest-end' // Fin del período de cosecha

/** Ventana de fechas en la que conviene realizar una etapa. */
export interface DateWindow {
  earliest: IsoDate
  latest: IsoDate
}

export interface ScheduleStage {
  id: StageId
  /** Para `flat-pricking-out`: número del almácigo al que se repica. */
  flatNumber?: number
  window: DateWindow
}

export interface ScheduleWarning {
  code: 'duration-not-given'
  field: 'flat' | 'maturity' | 'harvest-period'
  /** Para `field = 'flat'`: número del almácigo. */
  flatNumber?: number
  bookValue: string
}

export interface CropSchedule {
  cropId: string
  method: PropagationMethod
  condition: GrowingCondition
  anchorDate: IsoDate
  /** Ordenadas cronológicamente. */
  stages: ScheduleStage[]
  warnings: ScheduleWarning[]
}

export interface ScheduleOptions {
  /** Por defecto, el primer método del cultivo. */
  method?: PropagationMethod
  /** Juego de datos para los valores con código "#". Por defecto, `mild-winter`. */
  condition?: GrowingCondition
}

/** Código "#": dar un trato duro al almácigo, a la intemperie, antes de trasplantar. */
const HARDENING_DAYS = 2

const shortest = (range: DurationRange): Duration => ({ amount: range.min, unit: range.unit })
const longest = (range: DurationRange): Duration => ({ amount: range.max, unit: range.unit })

/**
 * Calcula el calendario de un cultivo a partir de la fecha ancla: la fecha de trasplante a
 * la cama (o la de siembra directa, si el cultivo va directo a la cama).
 *
 * - Las etapas de almácigo se calculan restando a la fecha ancla los tiempos en almácigo.
 * - La cosecha se calcula sumando a la fecha ancla las semanas a madurez y de cosecha.
 *
 * Como el libro da rangos (p. ej. 3-4 semanas), cada etapa es una ventana. Antes de la fecha
 * ancla, `earliest` usa los tiempos máximos; después, `earliest` usa los mínimos.
 */
export function calculateSchedule(
  crop: Crop,
  anchorDate: IsoDate,
  options: ScheduleOptions = {},
): CropSchedule {
  parseIsoDate(anchorDate)

  const method = options.method ?? crop.propagations[0].method
  const propagation = crop.propagations.find((p) => p.method === method)
  if (!propagation) {
    throw new Error(`El cultivo "${crop.id}" no admite el método "${method}".`)
  }

  const condition = options.condition ?? 'mild-winter'
  const warnings: ScheduleWarning[] = []
  const known = (duration: BookDuration, warning: Omit<ScheduleWarning, 'code' | 'bookValue'>) => {
    if (duration.range === null) {
      warnings.push({ code: 'duration-not-given', bookValue: duration.bookValue, ...warning })
    }
    return condition === 'cold-winter' && duration.coldWinterRange
      ? duration.coldWinterRange
      : duration.range
  }

  const stages: ScheduleStage[] = []
  const at = (direction: 1 | -1, earliest: Duration[], latest: Duration[]): DateWindow => ({
    earliest: shiftIsoDate(anchorDate, earliest, direction),
    latest: shiftIsoDate(anchorDate, latest, direction),
  })

  // Almácigos: la etapa del almácigo i empieza cuando faltan los almácigos i..n.
  const flatRanges = propagation.flats.map((flat, index) => known(flat, { field: 'flat', flatNumber: index + 1 }))
  if (flatRanges.every((range) => range !== null)) {
    flatRanges.forEach((_, index) => {
      const remaining = flatRanges.slice(index)
      stages.push({
        id: index === 0 ? 'flat-sowing' : 'flat-pricking-out',
        ...(index > 0 && { flatNumber: index + 1 }),
        window: at(-1, remaining.map(longest), remaining.map(shortest)),
      })
    })

    if (propagation.flats.some((flat) => flat.coldWinterRange)) {
      const hardening = shiftIsoDate(anchorDate, [{ amount: HARDENING_DAYS, unit: 'days' }], -1)
      stages.push({ id: 'flat-hardening', window: { earliest: hardening, latest: hardening } })
    }
  }

  stages.push({
    id: method === 'direct' ? 'bed-direct-sowing' : 'bed-transplant',
    window: { earliest: anchorDate, latest: anchorDate },
  })

  // Cosecha.
  const maturity = known(propagation.maturity ?? crop.maturity, { field: 'maturity' })
  if (maturity) {
    stages.push({ id: 'harvest-start', window: at(1, [shortest(maturity)], [longest(maturity)]) })

    const period = crop.harvestPeriod && known(crop.harvestPeriod, { field: 'harvest-period' })
    if (period) {
      stages.push({
        id: 'harvest-end',
        window: at(1, [shortest(maturity), shortest(period)], [longest(maturity), longest(period)]),
      })
    }
  }

  return { cropId: crop.id, method, condition, anchorDate, stages, warnings }
}

/** Indica si el cultivo tiene valores con código "#" (dependen de la condición de siembra). */
export function hasTwoDataSets(crop: Crop): boolean {
  return crop.propagations.some((p) => p.flats.some((flat) => flat.coldWinterRange))
}
