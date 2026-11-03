import type { Crop, Propagation } from '../../domain/crops/types'
import type { CropSchedule, ScheduleStage } from '../../domain/schedule/calculateSchedule'

export interface RowContext {
  crop: Crop
  propagation: Propagation
  schedule: CropSchedule
}

/** Columna de la tabla: un momento del calendario. */
export interface StageColumn {
  key: string
  label: string
  /** Si es `true`, la columna se muestra aunque ninguna fila la use. */
  always: boolean
  matches: (stage: ScheduleStage) => boolean
  /** Texto de la celda cuando la fila no tiene esta etapa. */
  emptyText: (row: RowContext) => string
}

export const NOT_APPLICABLE = '—'
export const NOT_GIVEN = 'Sin dato'

const hasWarning = (row: RowContext, ...fields: string[]) =>
  row.schedule.warnings.some((w) => fields.includes(w.field))

const flatEmptyText = (flatIndex: number) => (row: RowContext) =>
  flatIndex < row.propagation.flats.length && hasWarning(row, 'flat') ? NOT_GIVEN : NOT_APPLICABLE

/** Columnas antes de la fecha de trasplante (que se edita en su propia columna). */
export const beforeAnchorColumns: StageColumn[] = [
  {
    key: 'flat-1',
    label: 'Siembra en almácigo 1',
    always: true,
    matches: (s) => s.id === 'flat-sowing',
    emptyText: flatEmptyText(0),
  },
  {
    key: 'flat-2',
    label: 'Repique a almácigo 2',
    always: true,
    matches: (s) => s.id === 'flat-pricking-out' && s.flatNumber === 2,
    emptyText: flatEmptyText(1),
  },
  {
    key: 'flat-3',
    label: 'Repique a almácigo 3',
    always: false,
    matches: (s) => s.id === 'flat-pricking-out' && s.flatNumber === 3,
    emptyText: flatEmptyText(2),
  },
  {
    key: 'hardening',
    label: 'Endurecer almácigo (2 días)',
    always: false,
    matches: (s) => s.id === 'flat-hardening',
    emptyText: () => NOT_APPLICABLE,
  },
]

/** Columnas después de la fecha de trasplante. */
export const afterAnchorColumns: StageColumn[] = [
  {
    key: 'harvest-start',
    label: 'Inicio de cosecha',
    always: true,
    matches: (s) => s.id === 'harvest-start',
    emptyText: (row) => (hasWarning(row, 'maturity') ? NOT_GIVEN : NOT_APPLICABLE),
  },
  {
    key: 'harvest-end',
    label: 'Fin de cosecha',
    always: true,
    matches: (s) => s.id === 'harvest-end',
    emptyText: (row) => {
      if (hasWarning(row, 'maturity', 'harvest-period')) return NOT_GIVEN
      return row.crop.harvestPeriod === null ? 'Cosecha única' : NOT_APPLICABLE
    },
  },
]

/** Columnas que se muestran: las fijas y las opcionales que alguna fila usa. */
export function visibleColumns(columns: StageColumn[], schedules: CropSchedule[]): StageColumn[] {
  return columns.filter(
    (column) => column.always || schedules.some((s) => s.stages.some(column.matches)),
  )
}
