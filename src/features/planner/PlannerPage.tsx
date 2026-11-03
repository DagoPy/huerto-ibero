import { useState, type FormEvent } from 'react'
import { crops, findCrop } from '../../domain/crops/catalog'
import type { PropagationMethod } from '../../domain/crops/types'
import { calculateSchedule } from '../../domain/schedule/calculateSchedule'
import type { IsoDate } from '../../domain/schedule/dates'
import { formatDate } from '../../shared/formatDate'
import { methodLabels, seasonLabels, stageLabel, warningMessage } from './labels'
import './PlannerPage.css'

interface Planting {
  key: string
  cropId: string
  anchorDate: IsoDate
  method: PropagationMethod
}

export function PlannerPage() {
  const [plantings, setPlantings] = useState<Planting[]>([])
  const [cropId, setCropId] = useState(crops[0].id)
  const [anchorDate, setAnchorDate] = useState<IsoDate>('')

  function addPlanting(event: FormEvent) {
    event.preventDefault()
    const crop = findCrop(cropId)
    if (!crop || !anchorDate) return
    setPlantings((current) => [
      ...current,
      { key: crypto.randomUUID(), cropId, anchorDate, method: crop.propagations[0].method },
    ])
  }

  function updatePlanting(key: string, changes: Partial<Planting>) {
    setPlantings((current) => current.map((p) => (p.key === key ? { ...p, ...changes } : p)))
  }

  function removePlanting(key: string) {
    setPlantings((current) => current.filter((p) => p.key !== key))
  }

  return (
    <main className="planner">
      <header>
        <h1>Planeador de huerto biointensivo</h1>
        <p>
          Elige una hortaliza y la fecha en que la trasplantarás a la cama de siembra. Las demás
          fechas se calculan a partir de ella.
        </p>
      </header>

      <form className="planner-form" onSubmit={addPlanting}>
        <label>
          Hortaliza
          <select value={cropId} onChange={(e) => setCropId(e.target.value)}>
            {crops.map((crop) => (
              <option key={crop.id} value={crop.id}>
                {crop.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Fecha de trasplante
          <input
            type="date"
            required
            value={anchorDate}
            onChange={(e) => setAnchorDate(e.target.value)}
          />
        </label>
        <button type="submit">Agregar</button>
      </form>

      {plantings.length === 0 && <p className="empty">Aún no has agregado hortalizas.</p>}

      <ul className="plantings">
        {plantings.map((planting) => {
          const crop = findCrop(planting.cropId)
          if (!crop) return null
          const schedule = calculateSchedule(crop, planting.anchorDate, {
            method: planting.method,
          })
          const propagation = crop.propagations.find((p) => p.method === planting.method)
          const anchorLabel =
            planting.method === 'direct' ? 'Fecha de siembra directa' : 'Fecha de trasplante'

          return (
            <li key={planting.key} className="planting">
              <div className="planting-header">
                <h2>
                  {crop.name} <small>{crop.scientificName}</small>
                </h2>
                <button
                  type="button"
                  className="remove"
                  onClick={() => removePlanting(planting.key)}
                >
                  Quitar
                </button>
              </div>

              <div className="planting-controls">
                <label>
                  {anchorLabel}
                  <input
                    type="date"
                    required
                    value={planting.anchorDate}
                    onChange={(e) =>
                      e.target.value && updatePlanting(planting.key, { anchorDate: e.target.value })
                    }
                  />
                </label>
                {crop.propagations.length > 1 && (
                  <label>
                    Método
                    <select
                      value={planting.method}
                      onChange={(e) =>
                        updatePlanting(planting.key, {
                          method: e.target.value as PropagationMethod,
                        })
                      }
                    >
                      {crop.propagations.map(({ method }) => (
                        <option key={method} value={method}>
                          {methodLabels[method]}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>

              <ol className="stages">
                {schedule.stages.map((stage) => (
                  <li key={`${stage.id}-${stage.flatNumber ?? ''}`}>
                    <span className="stage-name">{stageLabel(stage)}</span>
                    <span className="stage-date">
                      {stage.window.earliest === stage.window.latest
                        ? formatDate(stage.window.earliest)
                        : `entre ${formatDate(stage.window.earliest)} y ${formatDate(stage.window.latest)}`}
                    </span>
                  </li>
                ))}
              </ol>

              {schedule.warnings.map((warning) => (
                <p key={`${warning.field}-${warning.flatNumber ?? ''}`} className="warning">
                  {warningMessage(warning)}
                </p>
              ))}
              {propagation?.notes && <p className="notes">{propagation.notes}</p>}
              {crop.notes && <p className="notes">{crop.notes}</p>}
              <p className="notes">
                Temporada de siembra según el libro:{' '}
                {crop.seasons.map((season) => seasonLabels[season]).join(', ')}.
              </p>
            </li>
          )
        })}
      </ul>
    </main>
  )
}
