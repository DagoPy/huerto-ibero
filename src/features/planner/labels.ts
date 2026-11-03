import type { GrowingCondition, PropagationMethod, Season } from '../../domain/crops/types'
import type { ScheduleStage, ScheduleWarning } from '../../domain/schedule/calculateSchedule'

export function stageLabel(stage: ScheduleStage): string {
  switch (stage.id) {
    case 'flat-sowing':
      return 'Siembra en almácigo 1'
    case 'flat-pricking-out':
      return `Repique a almácigo ${stage.flatNumber}`
    case 'flat-hardening':
      return 'Endurecer el almácigo a la intemperie (2 días)'
    case 'bed-transplant':
      return 'Trasplante a la cama'
    case 'bed-direct-sowing':
      return 'Siembra directa en la cama'
    case 'harvest-start':
      return 'Inicio de cosecha'
    case 'harvest-end':
      return 'Fin de cosecha'
  }
}

export const methodLabels: Record<PropagationMethod, string> = {
  flats: 'En almácigo',
  direct: 'Directo en la cama',
}

export const conditionLabels: Record<GrowingCondition, string> = {
  'mild-winter':
    'Siembra en verano con sombra, o en invierno con invernadero en zonas de invierno poco frío',
  'cold-winter': 'Siembra en invierno dentro de invernadero, en zonas de invierno muy frío',
}

export const seasonLabels: Record<Season, string> = {
  spring: 'primavera',
  summer: 'verano',
  autumn: 'otoño',
  winter: 'invierno',
}

export function warningMessage(warning: ScheduleWarning): string {
  const what = {
    flat: `las semanas en el almácigo ${warning.flatNumber}`,
    maturity: 'el tiempo hasta la madurez',
    'harvest-period': 'la duración del período de cosecha',
  }[warning.field]
  return `El libro no indica ${what} (valor: "${warning.bookValue}"), así que no se calcula esa fecha.`
}
