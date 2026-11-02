/** Tiempo de germinación según la columna D del libro: TE / TA / MT. */
export type GerminationSpeed = 'early' | 'late' | 'very-late'

/**
 * Forma de iniciar el cultivo (columna E):
 * - `flats`: se siembra en almácigo y después se trasplanta a la cama.
 * - `direct`: se siembra (semilla, dientes, tubérculos, raíces...) directo en la cama.
 */
export type PropagationMethod = 'flats' | 'direct'

export type DurationUnit = 'weeks' | 'days'

export interface DurationRange {
  min: number
  max: number
  unit: DurationUnit
}

/**
 * Tiempo que pasa una planta en un almácigo (columnas H y L).
 *
 * `bookValue` conserva el texto original del libro (con sus notas, p. ej. "2-3^P / 3-4")
 * para poder rastrear y corregir el dato. `range` es la ventana que usa el cálculo: cuando
 * el libro da varias alternativas, abarca desde el mínimo hasta el máximo de todas.
 * `range` es `null` cuando el libro no da un número (p. ej. "D").
 */
export interface FlatDuration {
  bookValue: string
  range: DurationRange | null
}

export interface Crop {
  id: string
  /** Número del cultivo en la tabla del libro. */
  bookNumber: number
  name: string
  scientificName: string
  germination: GerminationSpeed[]
  /** El primero es el método por defecto. */
  methods: PropagationMethod[]
  /** Columna H. `null` si el cultivo no usa almácigo. */
  flat1: FlatDuration | null
  /** Columna L. `null` si el cultivo no usa segundo almácigo. */
  flat2: FlatDuration | null
  /** Columna M: distancia entre plantas en la cama (cm). Varios valores si el libro da opciones. */
  bedSpacingCm: number[]
  notes?: string
}
