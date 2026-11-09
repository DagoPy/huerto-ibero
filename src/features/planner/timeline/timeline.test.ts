import { describe, expect, it } from 'vitest'
import { findCrop } from '../../../domain/crops/catalog'
import type { Crop } from '../../../domain/crops/types'
import { calculateSchedule } from '../../../domain/schedule/calculateSchedule'
import { buildCropTimeline, isInScale, monthColumns, monthScale, percentOf } from './timeline'

function crop(id: string): Crop {
  const found = findCrop(id)
  if (!found) throw new Error(`No existe el cultivo ${id}`)
  return found
}

const timelineOf = (id: string, anchor: string) =>
  buildCropTimeline(crop(id), calculateSchedule(crop(id), anchor))

describe('buildCropTimeline', () => {
  it('encadena almácigos, cama y cosecha sin encimarse', () => {
    // Jitomate con trasplante el 01/05/27 (fechas en calculateSchedule.test.ts).
    const timeline = timelineOf('tomato', '2027-05-01')

    expect(timeline.bars).toEqual([
      { kind: 'flat', label: 'Almácigo 1', shortLabel: 'A1', from: '2027-02-20', to: '2027-04-03' },
      { kind: 'pricking', label: 'Almácigo 2', shortLabel: 'A2', from: '2027-04-03', to: '2027-05-01' },
      { kind: 'bed', label: 'En la cama', shortLabel: 'Cama', from: '2027-05-01', to: '2027-06-26' },
      { kind: 'harvest', label: 'Cosecha', shortLabel: 'Cos.', from: '2027-06-26', to: '2027-11-27' },
    ])
    expect(timeline.anchor).toBe('2027-05-01')
    expect(timeline.earliest).toBe('2027-02-20')
    expect(timeline.latest).toBe('2027-11-27')
    expect(timeline.missingBefore).toBe(false)
    expect(timeline.missingAfter).toBe(false)
  })

  it('en una sola cosecha, la barra de cosecha abarca la ventana de inicio', () => {
    // Ajo: siembra directa, cosecha entre 16/02/28 y 23/08/28.
    const timeline = timelineOf('garlic', '2027-10-20')

    expect(timeline.bars).toEqual([
      { kind: 'bed', label: 'En la cama', shortLabel: 'Cama', from: '2027-10-20', to: '2028-02-16' },
      { kind: 'harvest', label: 'Cosecha', shortLabel: 'Cos.', from: '2028-02-16', to: '2028-08-23' },
    ])
  })

  it('marca "sin dato" cuando el libro no da el tiempo a madurez', () => {
    // Alcachofa común: madurez "D, P".
    const timeline = timelineOf('globe-artichoke', '2027-04-01')

    expect(timeline.bars.map((bar) => bar.kind)).toEqual(['flat', 'pricking'])
    expect(timeline.missingBefore).toBe(false)
    expect(timeline.missingAfter).toBe(true)
  })

  it('marca "sin dato" cuando el libro no da el tiempo en almácigo', () => {
    // Ruibarbo en almácigo: H y L "D".
    const timeline = timelineOf('rhubarb', '2027-04-01')

    expect(timeline.bars.some((bar) => bar.kind === 'flat')).toBe(false)
    expect(timeline.missingBefore).toBe(true)
  })
})

describe('monthScale', () => {
  it('abarca meses completos, incluido el cambio de año', () => {
    expect(monthScale('2026-11-20', '2027-02-03')).toEqual({
      start: '2026-11-01',
      end: '2027-03-01',
      days: 30 + 31 + 31 + 28,
    })
  })

  it('cuenta días de calendario aunque haya cambio de horario', () => {
    // Abril de 2026 tiene el cambio de horario de verano en varios países.
    expect(monthScale('2026-03-15', '2026-04-10').days).toBe(31 + 30)
  })
})

describe('percentOf', () => {
  const scale = monthScale('2027-01-10', '2027-02-10') // 59 días desde el 01/01/27

  it('ubica una fecha según los días transcurridos', () => {
    expect(percentOf('2027-01-01', scale)).toBe(0)
    expect(percentOf('2027-03-01', scale)).toBe(100)
    expect(percentOf('2027-02-01', scale)).toBeCloseTo((31 / 59) * 100)
  })

  it('recorta las fechas fuera de la escala', () => {
    expect(percentOf('2026-12-01', scale)).toBe(0)
    expect(percentOf('2027-05-01', scale)).toBe(100)
  })

  it('isInScale excluye el día final', () => {
    expect(isInScale('2027-02-28', scale)).toBe(true)
    expect(isInScale('2027-03-01', scale)).toBe(false)
  })
})

describe('monthColumns', () => {
  it('da una columna por mes que suma el 100 %, con el año en la primera y en enero', () => {
    const columns = monthColumns(monthScale('2026-11-20', '2027-02-03'))

    expect(columns.map((c) => c.label)).toEqual(['nov 26', 'dic', 'ene 27', 'feb'])
    expect(columns.map((c) => c.initial)).toEqual(['N', 'D', 'E', 'F'])
    expect(columns[0].left).toBe(0)
    expect(columns.reduce((sum, c) => sum + c.width, 0)).toBeCloseTo(100)
  })

  it('agrupa meses en planes muy largos', () => {
    // 36 meses → columnas de 3 meses.
    const columns = monthColumns(monthScale('2027-01-01', '2029-12-31'))

    expect(columns).toHaveLength(12)
    expect(columns[1].date).toBe('2027-04-01')
    expect(columns.slice(3, 5).map((c) => c.label)).toEqual(['oct', 'ene 28'])
  })

  it('muestra el año al cambiar aunque la columna no empiece en enero', () => {
    // 38 meses desde noviembre → columnas de 3 meses: nov 26, feb 27, may, ago, nov, feb 28...
    const columns = monthColumns(monthScale('2026-11-01', '2029-12-31'))

    expect(columns.slice(0, 6).map((c) => c.label)).toEqual([
      'nov 26',
      'feb 27',
      'may',
      'ago',
      'nov',
      'feb 28',
    ])
  })
})
