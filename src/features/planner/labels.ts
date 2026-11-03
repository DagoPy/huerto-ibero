import type { PropagationMethod, Season } from '../../domain/crops/types'
import type { ScheduleStage, ScheduleWarning } from '../../domain/schedule/calculateSchedule'

export function stageLabel(stage: ScheduleStage): string {
  switch (stage.id) {
    case 'flat-sowing':
      return 'Siembra en almácigo 1'
    case 'flat-pricking-out':
      return `Repique a almácigo ${stage.flatNumber}`
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
