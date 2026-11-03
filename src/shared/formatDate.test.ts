import { describe, expect, it } from 'vitest'
import { formatDate, formatWindow } from './formatDate'

describe('formatDate', () => {
  it('usa el formato dd/mm/aa', () => {
    expect(formatDate('2027-05-01')).toBe('01/05/27')
    expect(formatDate('2028-12-31')).toBe('31/12/28')
  })
})

describe('formatWindow', () => {
  it('muestra una sola fecha si la ventana es de un día', () => {
    expect(formatWindow({ earliest: '2027-05-01', latest: '2027-05-01' })).toBe('01/05/27')
  })

  it('muestra el rango si la ventana abarca varios días', () => {
    expect(formatWindow({ earliest: '2027-02-20', latest: '2027-03-13' })).toBe('20/02/27 – 13/03/27')
  })
})
