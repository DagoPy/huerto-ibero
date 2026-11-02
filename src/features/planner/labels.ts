import type { PropagationMethod } from '../../domain/crops/types'
import type { ScheduleWarning, StageId } from '../../domain/schedule/calculateSchedule'

export const stageLabels: Record<StageId, string> = {
  'flat1-sowing': 'Siembra en almácigo 1',
  'flat2-pricking-out': 'Repique a almácigo 2',
  'bed-transplant': 'Trasplante a la cama',
  'bed-direct-sowing': 'Siembra directa en la cama',
}

export const methodLabels: Record<PropagationMethod, string> = {
  flats: 'En almácigo',
  direct: 'Directo en la cama',
}

const flatNames = { flat1: 'el almácigo 1', flat2: 'el almácigo 2' }

export function warningMessage(warning: ScheduleWarning): string {
  return `El libro no indica las semanas en ${flatNames[warning.flat]} (valor: "${warning.bookValue}"). Consulta la nota correspondiente.`
}
