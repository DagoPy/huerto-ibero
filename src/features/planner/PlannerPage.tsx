import { useState, type FormEvent } from 'react'
import { crops, findCrop } from '../../domain/crops/catalog'
import type { GrowingCondition, PropagationMethod } from '../../domain/crops/types'
import { calculateSchedule } from '../../domain/schedule/calculateSchedule'
import type { IsoDate } from '../../domain/schedule/dates'
import { formatWindow } from '../../shared/formatDate'
import {
  afterAnchorColumns,
  beforeAnchorColumns,
  NOT_GIVEN,
  visibleColumns,
  type RowContext,
  type StageColumn,
} from './columns'
import { conditionLabels, methodLabels, seasonLabels, warningMessage } from './labels'
import './PlannerPage.css'

interface Planting {
  key: string
  cropId: string
  anchorDate: IsoDate
  method: PropagationMethod
}

interface Row extends RowContext {
  planting: Planting
}

function CropOptions() {
  return crops.map((crop) => (
    <option key={crop.id} value={crop.id}>
      {crop.name}
    </option>
  ))
}

export function PlannerPage() {
  const [plantings, setPlantings] = useState<Planting[]>([])
  const [condition, setCondition] = useState<GrowingCondition>('mild-winter')
  const [newCropId, setNewCropId] = useState(crops[0].id)
  const [newAnchorDate, setNewAnchorDate] = useState<IsoDate>('')

  function addPlanting(event: FormEvent) {
    event.preventDefault()
    const crop = findCrop(newCropId)
    if (!crop || !newAnchorDate) return
    setPlantings((current) => [
      ...current,
      {
        key: crypto.randomUUID(),
        cropId: crop.id,
        anchorDate: newAnchorDate,
        method: crop.propagations[0].method,
      },
    ])
  }

  function updatePlanting(key: string, changes: Partial<Planting>) {
    setPlantings((current) => current.map((p) => (p.key === key ? { ...p, ...changes } : p)))
  }

  function changeCrop(key: string, cropId: string) {
    const crop = findCrop(cropId)
    if (crop) updatePlanting(key, { cropId, method: crop.propagations[0].method })
  }

  function removePlanting(key: string) {
    setPlantings((current) => current.filter((p) => p.key !== key))
  }

  const rows: Row[] = plantings.flatMap((planting) => {
    const crop = findCrop(planting.cropId)
    const propagation = crop?.propagations.find((p) => p.method === planting.method)
    if (!crop || !propagation) return []
    const schedule = calculateSchedule(crop, planting.anchorDate, {
      method: planting.method,
      condition,
    })
    return [{ planting, crop, propagation, schedule }]
  })

  const schedules = rows.map((row) => row.schedule)
  const before = visibleColumns(beforeAnchorColumns, schedules)
  const after = visibleColumns(afterAnchorColumns, schedules)
  const columnCount = 3 + before.length + after.length + 1

  function stageCell(column: StageColumn, row: Row) {
    const stage = row.schedule.stages.find(column.matches)
    if (stage) return <td key={column.key}>{formatWindow(stage.window)}</td>
    const text = column.emptyText(row)
    return (
      <td key={column.key} className={text === NOT_GIVEN ? 'cell-missing' : 'cell-empty'}>
        {text}
      </td>
    )
  }

  return (
    <main className="planner">
      <header>
        <h1>Planeador de huerto biointensivo</h1>
        <p>
          Agrega las hortalizas y la fecha en que las trasplantarás a la cama de siembra. Las
          demás fechas se calculan a partir de ella (formato dd/mm/aa).
        </p>
      </header>

      <label className="planner-condition">
        Condición de siembra
        <select
          value={condition}
          onChange={(e) => setCondition(e.target.value as GrowingCondition)}
        >
          {Object.entries(conditionLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <small>
          Solo cambia los tiempos en almácigo marcados con "#" en el libro (coles, cebollas,
          pepino, berenjena, chiles y pimientos).
        </small>
      </label>

      <div className="table-wrapper">
        <table className="schedule-table">
          <thead>
            <tr>
              <th scope="col">Hortaliza</th>
              <th scope="col">Método</th>
              {before.map((column) => (
                <th key={column.key} scope="col">
                  {column.label}
                </th>
              ))}
              <th scope="col" className="anchor">
                Trasplante / siembra directa
              </th>
              {after.map((column) => (
                <th key={column.key} scope="col">
                  {column.label}
                </th>
              ))}
              <th scope="col">
                <span className="visually-hidden">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={columnCount} className="cell-empty">
                  Aún no has agregado hortalizas. Usa la última fila para agregar la primera.
                </td>
              </tr>
            )}
            {rows.map((row) => {
              const { planting, crop } = row
              return (
                <tr key={planting.key}>
                  <th scope="row">
                    <select
                      aria-label="Hortaliza"
                      value={planting.cropId}
                      onChange={(e) => changeCrop(planting.key, e.target.value)}
                    >
                      <CropOptions />
                    </select>
                  </th>
                  <td>
                    {crop.propagations.length > 1 ? (
                      <select
                        aria-label="Método"
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
                    ) : (
                      methodLabels[planting.method]
                    )}
                  </td>
                  {before.map((column) => stageCell(column, row))}
                  <td className="anchor">
                    <input
                      type="date"
                      aria-label="Fecha de trasplante o siembra directa"
                      required
                      value={planting.anchorDate}
                      onChange={(e) =>
                        e.target.value &&
                        updatePlanting(planting.key, { anchorDate: e.target.value })
                      }
                    />
                  </td>
                  {after.map((column) => stageCell(column, row))}
                  <td>
                    <button
                      type="button"
                      className="remove"
                      aria-label={`Quitar ${crop.name}`}
                      onClick={() => removePlanting(planting.key)}
                    >
                      Quitar
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={columnCount}>
                <form className="add-row" onSubmit={addPlanting}>
                  <label>
                    Hortaliza
                    <select value={newCropId} onChange={(e) => setNewCropId(e.target.value)}>
                      <CropOptions />
                    </select>
                  </label>
                  <label>
                    Fecha de trasplante
                    <input
                      type="date"
                      required
                      value={newAnchorDate}
                      onChange={(e) => setNewAnchorDate(e.target.value)}
                    />
                  </label>
                  <button type="submit">Agregar hortaliza</button>
                </form>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {rows.length > 0 && (
        <section className="row-notes">
          <h2>Notas</h2>
          <p className="notes">
            La cosecha se estima contando las semanas a madurez del libro desde el trasplante a
            la cama. "{NOT_GIVEN}": el libro no da ese tiempo (código D).
          </p>
          <ul>
            {rows.map(({ planting, crop, propagation, schedule }) => (
              <li key={planting.key}>
                <strong>{crop.name}</strong> <em>({crop.scientificName})</em>. Temporada de
                siembra: {crop.seasons.map((season) => seasonLabels[season]).join(', ')}.
                {schedule.warnings.map((warning) => (
                  <span key={`${warning.field}-${warning.flatNumber ?? ''}`} className="warning">
                    {' '}
                    {warningMessage(warning)}
                  </span>
                ))}
                {propagation.notes && ` ${propagation.notes}`}
                {crop.notes && ` ${crop.notes}`}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}
