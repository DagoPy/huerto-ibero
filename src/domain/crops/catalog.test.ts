import { describe, expect, it } from 'vitest'
import { crops } from './catalog'

describe('catálogo de cultivos', () => {
  it('no repite identificadores ni números del libro', () => {
    expect(new Set(crops.map((crop) => crop.id)).size).toBe(crops.length)
    expect(new Set(crops.map((crop) => crop.bookNumber)).size).toBe(crops.length)
  })

  it.each(crops)('$name tiene datos coherentes', (crop) => {
    expect(crop.methods.length).toBeGreaterThan(0)
    expect(crop.bedSpacingCm.length).toBeGreaterThan(0)

    if (crop.methods.includes('flats')) {
      expect(crop.flat1).not.toBeNull()
    } else {
      expect(crop.flat1).toBeNull()
      expect(crop.flat2).toBeNull()
    }

    for (const flat of [crop.flat1, crop.flat2]) {
      if (flat?.range) {
        expect(flat.range.min).toBeGreaterThan(0)
        expect(flat.range.max).toBeGreaterThanOrEqual(flat.range.min)
      }
    }
  })
})
