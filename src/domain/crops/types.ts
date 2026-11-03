/** Tiempo de germinación según la columna D del libro: TE / TA / MT. */
export type GerminationSpeed = 'early' | 'late' | 'very-late'

/**
 * Forma de iniciar el cultivo (columna E):
 * - `flats`: se siembra en almácigo y después se trasplanta a la cama.
 * - `direct`: se siembra (semilla, dientes, tubérculos, raíces...) directo en la cama.
 */
export type PropagationMethod = 'flats' | 'direct'

/** Temporada de siembra (columna T): PR / VE / OT / IN. */
export type Season = 'spring' | 'summer' | 'autumn' | 'winter'

export type DurationUnit = 'days' | 'weeks' | 'years'

export interface DurationRange {
  min: number
  max: number
  unit: DurationUnit
}

/**
 * Un tiempo tomado de la tabla del libro.
 *
 * `bookValue` conserva el texto original (con sus códigos, p. ej. "2-3^P / 3-4") para poder
 * rastrear y corregir el dato. `range` es la ventana que usa el cálculo: cuando el libro da
 * varias alternativas, abarca desde el mínimo hasta el máximo de todas. `range` es `null`
 * cuando el libro no da un número (código "D": desconocido).
 */
export interface BookDuration {
  bookValue: string
  range: DurationRange | null
}

export interface Propagation {
  method: PropagationMethod
  /**
   * Tiempo en cada almácigo, en orden (columnas H y L; el apio tiene un tercero, código Q).
   * Vacío si se siembra directo en la cama.
   */
  flats: BookDuration[]
  /** Reemplaza `Crop.maturity` cuando el método cambia el tiempo a madurez (p. ej. raíces). */
  maturity?: BookDuration
  notes?: string
}

export interface Crop {
  id: string
  /** Número del cultivo en la tabla del libro. */
  bookNumber: number
  name: string
  scientificName: string
  germination: GerminationSpeed[]
  /** Formas de iniciar el cultivo. La primera es la predeterminada. */
  propagations: Propagation[]
  /** Columna R: semanas hasta la madurez, contadas desde el trasplante a la cama. */
  maturity: BookDuration
  /** Columna S: semanas en período de cosecha. `null` si es una sola cosecha ("-"). */
  harvestPeriod: BookDuration | null
  /** Columna T. */
  seasons: Season[]
  /** Columna M: distancia entre plantas en la cama (cm). Varios valores si el libro da opciones. */
  bedSpacingCm: number[]
  notes?: string
}
