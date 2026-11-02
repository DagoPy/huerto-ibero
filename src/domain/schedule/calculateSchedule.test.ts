import { describe, expect, it } from 'vitest'
import { findCrop } from '../crops/catalog'
import type { Crop } from '../crops/types'
import { calculateSchedule } from './calculateSchedule'

function crop(id: string): Crop {
  const found = findCrop(id)
  if (!found) throw new Error(`No existe el cultivo ${id}`)
  return found
}

describe('calculateSchedule', () => {
  it('calcula la siembra en almácigo 1 para cultivos de un solo almácigo', () => {
    // Acelga: 3-4 semanas en almácigo 1.
    const schedule = calculateSchedule(crop('swiss-chard'), '2027-03-01')

    expect(schedule.stages).toEqual([
      { id: 'flat1-sowing', window: { earliest: '2027-02-01', latest: '2027-02-08' } },
      { id: 'bed-transplant', window: { earliest: '2027-03-01', latest: '2027-03-01' } },
    ])
    expect(schedule.warnings).toEqual([])
  })

  it('suma ambos almácigos y calcula el repique para cultivos de dos almácigos', () => {
    // Jitomate: 4-6 semanas en almácigo 1 + 3-4 semanas en almácigo 2.
    const schedule = calculateSchedule(crop('tomato'), '2027-05-01')

    expect(schedule.stages).toEqual([
      // 10 semanas antes / 7 semanas antes
      { id: 'flat1-sowing', window: { earliest: '2027-02-20', latest: '2027-03-13' } },
      // 4 semanas antes / 3 semanas antes
      { id: 'flat2-pricking-out', window: { earliest: '2027-04-03', latest: '2027-04-10' } },
      { id: 'bed-transplant', window: { earliest: '2027-05-01', latest: '2027-05-01' } },
    ])
  })

  it('usa un valor exacto cuando el libro no da rango', () => {
    // Puerro: 6 semanas + 6 semanas.
    const schedule = calculateSchedule(crop('leek'), '2027-06-15')

    expect(schedule.stages[0].window).toEqual({ earliest: '2027-03-23', latest: '2027-03-23' })
    expect(schedule.stages[1].window).toEqual({ earliest: '2027-05-04', latest: '2027-05-04' })
  })

  it('interpreta los tiempos en días', () => {
    // Maíz dulce: 3-5 días en almácigo.
    const schedule = calculateSchedule(crop('sweet-corn'), '2027-04-10')

    expect(schedule.stages[0].window).toEqual({ earliest: '2027-04-05', latest: '2027-04-07' })
  })

  it('la fecha ancla es la siembra directa para cultivos que van directo a la cama', () => {
    const schedule = calculateSchedule(crop('garlic'), '2027-10-20')

    expect(schedule.method).toBe('direct')
    expect(schedule.stages).toEqual([
      { id: 'bed-direct-sowing', window: { earliest: '2027-10-20', latest: '2027-10-20' } },
    ])
  })

  it('permite elegir un método alternativo', () => {
    const schedule = calculateSchedule(crop('carrot'), '2027-04-01', { method: 'direct' })

    expect(schedule.stages.map((stage) => stage.id)).toEqual(['bed-direct-sowing'])
  })

  it('rechaza un método que el cultivo no admite', () => {
    expect(() => calculateSchedule(crop('garlic'), '2027-04-01', { method: 'flats' })).toThrow()
  })

  it('avisa cuando el libro no da el tiempo en almácigo', () => {
    // Espárrago: "D" en las columnas H y L.
    const schedule = calculateSchedule(crop('asparagus'), '2027-04-01')

    expect(schedule.stages.map((stage) => stage.id)).toEqual(['bed-transplant'])
    expect(schedule.warnings).toEqual([
      { code: 'flat-duration-not-given', flat: 'flat1', bookValue: 'D' },
      { code: 'flat-duration-not-given', flat: 'flat2', bookValue: 'D' },
    ])
  })

  it('cruza correctamente cambios de año y años bisiestos', () => {
    // Lechuga romana: 1-2 + 2-3 semanas = 21 a 35 días.
    const schedule = calculateSchedule(crop('lettuce-romaine'), '2028-03-01')

    expect(schedule.stages[0].window).toEqual({ earliest: '2028-01-26', latest: '2028-02-09' })
  })

  it('rechaza fechas inválidas', () => {
    expect(() => calculateSchedule(crop('tomato'), '2027-02-30')).toThrow()
    expect(() => calculateSchedule(crop('tomato'), '01/05/2027')).toThrow()
  })
})
