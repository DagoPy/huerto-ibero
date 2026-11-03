import { describe, expect, it } from 'vitest'
import { crops } from './catalog'
import type { BookDuration } from './types'

function expectValidRange(duration: BookDuration | null) {
  for (const range of [duration?.range, duration?.coldWinterRange]) {
    if (range) {
      expect(range.min).toBeGreaterThan(0)
      expect(range.max).toBeGreaterThanOrEqual(range.min)
    }
  }
}

describe('catálogo de cultivos', () => {
  it('incluye los 60 cultivos de la tabla, sin repetir', () => {
    expect(crops.map((crop) => crop.bookNumber)).toEqual(Array.from({ length: 60 }, (_, i) => i + 1))
    expect(new Set(crops.map((crop) => crop.id)).size).toBe(crops.length)
  })

  it.each(crops)('$name tiene datos coherentes', (crop) => {
    expect(crop.propagations.length).toBeGreaterThan(0)
    expect(new Set(crop.propagations.map((p) => p.method)).size).toBe(crop.propagations.length)
    expect(crop.seasons.length).toBeGreaterThan(0)
    expect(crop.seasons).not.toContain(undefined)
    expect(crop.bedSpacingCm.length).toBeGreaterThan(0)

    for (const propagation of crop.propagations) {
      expect(propagation.flats.length > 0).toBe(propagation.method === 'flats')
      propagation.flats.forEach(expectValidRange)
      expectValidRange(propagation.maturity ?? null)
    }
    expectValidRange(crop.maturity)
    expectValidRange(crop.harvestPeriod)
  })
})
