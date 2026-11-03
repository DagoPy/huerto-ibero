import { describe, expect, it } from 'vitest'
import { findCrop } from '../crops/catalog'
import type { Crop } from '../crops/types'
import { calculateSchedule, type StageId } from './calculateSchedule'

function crop(id: string): Crop {
  const found = findCrop(id)
  if (!found) throw new Error(`No existe el cultivo ${id}`)
  return found
}

function window(schedule: ReturnType<typeof calculateSchedule>, id: StageId, flatNumber?: number) {
  return schedule.stages.find((s) => s.id === id && s.flatNumber === flatNumber)?.window
}

describe('calculateSchedule', () => {
  it('calcula almácigo, trasplante y cosecha para un cultivo de un almácigo', () => {
    // Acelga: 3-4 semanas en almácigo, 7-8 semanas a madurez, 44 semanas de cosecha.
    const schedule = calculateSchedule(crop('swiss-chard'), '2027-03-01')

    expect(schedule.stages).toEqual([
      { id: 'flat-sowing', window: { earliest: '2027-02-01', latest: '2027-02-08' } },
      { id: 'bed-transplant', window: { earliest: '2027-03-01', latest: '2027-03-01' } },
      { id: 'harvest-start', window: { earliest: '2027-04-19', latest: '2027-04-26' } },
      { id: 'harvest-end', window: { earliest: '2028-02-21', latest: '2028-02-28' } },
    ])
    expect(schedule.warnings).toEqual([])
  })

  it('suma los almácigos restantes para cada etapa de un cultivo de dos almácigos', () => {
    // Jitomate: 4-6 + 3-4 semanas en almácigo, 8-13 a madurez, 17+ de cosecha.
    const schedule = calculateSchedule(crop('tomato'), '2027-05-01')

    expect(schedule.stages).toEqual([
      // 10 a 7 semanas antes
      { id: 'flat-sowing', window: { earliest: '2027-02-20', latest: '2027-03-13' } },
      // 4 a 3 semanas antes
      { id: 'flat-pricking-out', flatNumber: 2, window: { earliest: '2027-04-03', latest: '2027-04-10' } },
      { id: 'bed-transplant', window: { earliest: '2027-05-01', latest: '2027-05-01' } },
      // 8 a 13 semanas después
      { id: 'harvest-start', window: { earliest: '2027-06-26', latest: '2027-07-31' } },
      // 25 a 30 semanas después
      { id: 'harvest-end', window: { earliest: '2027-10-23', latest: '2027-11-27' } },
    ])
  })

  it('maneja el tercer almácigo del apio (código Q)', () => {
    // Apio: 4-6 + 4-6 + 4-6 semanas.
    const schedule = calculateSchedule(crop('celery'), '2027-06-01')

    expect(window(schedule, 'flat-sowing')).toEqual({ earliest: '2027-01-26', latest: '2027-03-09' })
    expect(window(schedule, 'flat-pricking-out', 2)).toEqual({ earliest: '2027-03-09', latest: '2027-04-06' })
    expect(window(schedule, 'flat-pricking-out', 3)).toEqual({ earliest: '2027-04-20', latest: '2027-05-04' })
  })

  it('usa un valor exacto cuando el libro no da rango', () => {
    // Puerro: 6 semanas + 6 semanas.
    const schedule = calculateSchedule(crop('leek'), '2027-06-15')

    expect(window(schedule, 'flat-sowing')).toEqual({ earliest: '2027-03-23', latest: '2027-03-23' })
    expect(window(schedule, 'flat-pricking-out', 2)).toEqual({ earliest: '2027-05-04', latest: '2027-05-04' })
  })

  it('interpreta los tiempos en días', () => {
    // Maíz dulce: 3-5 días en almácigo.
    const schedule = calculateSchedule(crop('sweet-corn'), '2027-04-10')

    expect(window(schedule, 'flat-sowing')).toEqual({ earliest: '2027-04-05', latest: '2027-04-07' })
  })

  it('no calcula fin de cosecha cuando es una sola cosecha', () => {
    // Ajo: siembra directa, 17-44 semanas a madurez, período de cosecha "-".
    const schedule = calculateSchedule(crop('garlic'), '2027-10-20')

    expect(schedule.method).toBe('direct')
    expect(schedule.stages).toEqual([
      { id: 'bed-direct-sowing', window: { earliest: '2027-10-20', latest: '2027-10-20' } },
      { id: 'harvest-start', window: { earliest: '2028-02-16', latest: '2028-08-23' } },
    ])
    expect(schedule.warnings).toEqual([])
  })

  it('usa la madurez propia del método cuando la hay', () => {
    // Espárrago por raíces: 1 año a madurez; por semilla: 4 años.
    const fromRoots = calculateSchedule(crop('asparagus'), '2027-04-01', { method: 'direct' })
    expect(window(fromRoots, 'harvest-start')).toEqual({ earliest: '2028-04-01', latest: '2028-04-01' })
    expect(window(fromRoots, 'harvest-end')).toEqual({ earliest: '2028-05-27', latest: '2028-05-27' })

    const fromSeed = calculateSchedule(crop('asparagus'), '2027-04-01')
    expect(window(fromSeed, 'harvest-start')).toEqual({ earliest: '2031-04-01', latest: '2031-04-01' })
  })

  it('permite elegir un método alternativo', () => {
    const schedule = calculateSchedule(crop('carrot'), '2027-04-01', { method: 'direct' })

    expect(schedule.stages.map((stage) => stage.id)).toEqual([
      'bed-direct-sowing',
      'harvest-start',
      'harvest-end',
    ])
  })

  it('rechaza un método que el cultivo no admite', () => {
    expect(() => calculateSchedule(crop('garlic'), '2027-04-01', { method: 'flats' })).toThrow()
  })

  it('avisa cuando el libro no da el tiempo en almácigo (código D)', () => {
    const schedule = calculateSchedule(crop('asparagus'), '2027-04-01')

    expect(schedule.stages.map((stage) => stage.id)).toEqual([
      'bed-transplant',
      'harvest-start',
      'harvest-end',
    ])
    expect(schedule.warnings).toEqual([
      { code: 'duration-not-given', field: 'flat', flatNumber: 1, bookValue: 'D' },
      { code: 'duration-not-given', field: 'flat', flatNumber: 2, bookValue: 'D' },
    ])
  })

  it('avisa cuando el libro no da la madurez o el período de cosecha', () => {
    const artichoke = calculateSchedule(crop('globe-artichoke'), '2027-04-01')
    expect(artichoke.stages.map((stage) => stage.id)).not.toContain('harvest-start')
    expect(artichoke.warnings).toEqual([
      { code: 'duration-not-given', field: 'maturity', bookValue: 'D, P' },
    ])

    const rhubarb = calculateSchedule(crop('rhubarb'), '2027-04-01', { method: 'direct' })
    expect(rhubarb.stages.map((stage) => stage.id)).toContain('harvest-start')
    expect(rhubarb.warnings).toEqual([
      { code: 'duration-not-given', field: 'harvest-period', bookValue: 'D' },
    ])
  })

  it('cruza correctamente cambios de año y años bisiestos', () => {
    // Lechuga romana: 1-2 + 2-3 semanas = 21 a 35 días.
    const schedule = calculateSchedule(crop('lettuce-romaine'), '2028-03-01')

    expect(window(schedule, 'flat-sowing')).toEqual({ earliest: '2028-01-26', latest: '2028-02-09' })
  })

  it('rechaza fechas inválidas', () => {
    expect(() => calculateSchedule(crop('tomato'), '2027-02-30')).toThrow()
    expect(() => calculateSchedule(crop('tomato'), '01/05/2027')).toThrow()
  })
})
