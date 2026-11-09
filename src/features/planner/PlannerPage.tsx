import { useEffect, useRef, useState, type FormEvent } from 'react'
import { crops, findCrop } from '../../domain/crops/catalog'
import type { GrowingCondition, PropagationMethod } from '../../domain/crops/types'
import { calculateSchedule, type DateWindow } from '../../domain/schedule/calculateSchedule'
import type { IsoDate } from '../../domain/schedule/dates'
import { formatDate } from '../../shared/formatDate'
import {
  afterAnchorColumns,
  beforeAnchorColumns,
  NOT_APPLICABLE,
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

/** Aviso tras agregar o quitar una hortaliza. Quitar se puede deshacer. */
type Notice =
  | { id: number; kind: 'added'; text: string }
  | { id: number; kind: 'removed'; text: string; planting: Planting; index: number }

const ANCHOR_LABEL = 'Trasplante o siembra directa'
const UNDO_BUTTON_ID = 'undo-remove'
/** Los avisos sin acción se ocultan solos; el de "quitar" espera a que lo cierres. */
const ADDED_NOTICE_MS = 5000

const cropSelectId = (key: string) => `crop-${key}`

function CropOptions() {
  return crops.map((crop) => (
    <option key={crop.id} value={crop.id}>
      {crop.name}
    </option>
  ))
}

/** Ventana de fechas; en escritorio el "hasta" baja a otra línea para no ensanchar la tabla. */
function DateWindowText({ window }: { window: DateWindow }) {
  if (window.earliest === window.latest) return formatDate(window.earliest)
  return (
    <span className="window">
      <span>{formatDate(window.earliest)}</span> <span>– {formatDate(window.latest)}</span>
    </span>
  )
}

export function PlannerPage() {
  const [plantings, setPlantings] = useState<Planting[]>([])
  const [condition, setCondition] = useState<GrowingCondition>('mild-winter')
  const [newCropId, setNewCropId] = useState(crops[0].id)
  const [newAnchorDate, setNewAnchorDate] = useState<IsoDate>('')
  const [notice, setNotice] = useState<Notice | null>(null)
  const noticeCount = useRef(0)
  /** Elemento que debe recibir el foco después del siguiente render. */
  const focusAfterRender = useRef<string | null>(null)

  useEffect(() => {
    if (!focusAfterRender.current) return
    document.getElementById(focusAfterRender.current)?.focus()
    focusAfterRender.current = null
  })

  useEffect(() => {
    if (notice?.kind !== 'added') return
    const timer = setTimeout(() => setNotice(null), ADDED_NOTICE_MS)
    return () => clearTimeout(timer)
  }, [notice])

  function nextNoticeId() {
    noticeCount.current += 1
    return noticeCount.current
  }

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
    setNotice({ id: nextNoticeId(), kind: 'added', text: `Se agregó ${crop.name} al calendario.` })
  }

  function updatePlanting(key: string, changes: Partial<Planting>) {
    setPlantings((current) => current.map((p) => (p.key === key ? { ...p, ...changes } : p)))
  }

  function changeCrop(key: string, cropId: string) {
    const crop = findCrop(cropId)
    if (crop) updatePlanting(key, { cropId, method: crop.propagations[0].method })
  }

  function removePlanting(key: string) {
    const index = plantings.findIndex((p) => p.key === key)
    if (index === -1) return
    const planting = plantings[index]
    setPlantings((current) => current.filter((p) => p.key !== key))
    setNotice({
      id: nextNoticeId(),
      kind: 'removed',
      text: `Se quitó ${findCrop(planting.cropId)?.name ?? 'la hortaliza'} del calendario.`,
      planting,
      index,
    })
    // El botón "Quitar" desaparece: el foco pasa a "Deshacer" para no perderse.
    focusAfterRender.current = UNDO_BUTTON_ID
  }

  function undoRemove() {
    if (notice?.kind !== 'removed') return
    const { planting, index } = notice
    setPlantings((current) => [...current.slice(0, index), planting, ...current.slice(index)])
    setNotice(null)
    focusAfterRender.current = cropSelectId(planting.key)
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
    if (stage) {
      return (
        <td key={column.key} data-label={column.label}>
          <DateWindowText window={stage.window} />
        </td>
      )
    }
    const text = column.emptyText(row)
    const className =
      text === NOT_GIVEN ? 'cell-missing' : text === NOT_APPLICABLE ? 'cell-na' : 'cell-empty'
    return (
      <td key={column.key} data-label={column.label} className={className}>
        {text}
      </td>
    )
  }

  return (
    <main className="planner">
      <header>
        <h1>Planeador de huerto biointensivo</h1>
        <p className="planner-intro">
          Agrega las hortalizas y la fecha en que las trasplantarás a la cama de siembra. Las
          demás fechas se calculan a partir de ella (formato dd/mm/aa).
        </p>
      </header>

      <section className="add-crop" aria-labelledby="add-crop-title">
        <h2 id="add-crop-title">Agregar hortaliza</h2>
        <form className="add-crop-fields" onSubmit={addPlanting}>
          <label className="field">
            Hortaliza
            <select value={newCropId} onChange={(e) => setNewCropId(e.target.value)}>
              <CropOptions />
            </select>
          </label>
          <label className="field">
            Fecha de trasplante o siembra directa
            <input
              type="date"
              required
              value={newAnchorDate}
              onChange={(e) => setNewAnchorDate(e.target.value)}
            />
          </label>
          <button type="submit">Agregar hortaliza</button>
        </form>
      </section>

      <section className="planner-section" aria-labelledby="calendar-title">
        <h2 id="calendar-title">Calendario</h2>
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
                  {ANCHOR_LABEL}
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
                <tr className="empty-row">
                  <td colSpan={columnCount} className="cell-empty">
                    Aún no has agregado hortalizas. Usa el formulario de arriba para agregar la
                    primera.
                  </td>
                </tr>
              )}
              {rows.map((row) => {
                const { planting, crop } = row
                return (
                  <tr key={planting.key}>
                    <th scope="row">
                      <select
                        id={cropSelectId(planting.key)}
                        className="crop-select"
                        aria-label="Hortaliza"
                        value={planting.cropId}
                        onChange={(e) => changeCrop(planting.key, e.target.value)}
                      >
                        <CropOptions />
                      </select>
                    </th>
                    <td data-label="Método">
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
                    <td className="anchor" data-label={ANCHOR_LABEL}>
                      <input
                        type="date"
                        aria-label={`Fecha de trasplante o siembra directa de ${crop.name}`}
                        required
                        value={planting.anchorDate}
                        onChange={(e) =>
                          e.target.value &&
                          updatePlanting(planting.key, { anchorDate: e.target.value })
                        }
                      />
                    </td>
                    {after.map((column) => stageCell(column, row))}
                    <td className="row-actions">
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
          </table>
        </div>
      </section>

      <fieldset className="planner-section planner-condition">
        <legend>Condición de siembra</legend>
        <p className="hint">
          Solo cambia los tiempos en almácigo marcados con "#" en el libro (coles, cebollas,
          pepino, berenjena, chiles y pimientos).
        </p>
        {(Object.entries(conditionLabels) as [GrowingCondition, string][]).map(
          ([value, label]) => (
            <label key={value} className="choice">
              <input
                type="radio"
                name="condition"
                value={value}
                checked={condition === value}
                onChange={() => setCondition(value)}
              />
              <span>{label}</span>
            </label>
          ),
        )}
      </fieldset>

      {rows.length > 0 && (
        <section className="planner-section row-notes" aria-labelledby="notes-title">
          <h2 id="notes-title">Notas</h2>
          <p className="hint">
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

      {/* La región existe siempre para que los lectores de pantalla anuncien cada aviso. */}
      <div className="toast-region" role="status" aria-live="polite">
        {notice && (
          <div className="toast" key={notice.id}>
            <span className="toast-text">{notice.text}</span>
            {notice.kind === 'removed' && (
              <button
                id={UNDO_BUTTON_ID}
                type="button"
                className="toast-action"
                onClick={undoRemove}
              >
                Deshacer
              </button>
            )}
            <button
              type="button"
              className="toast-close"
              aria-label="Cerrar aviso"
              onClick={() => setNotice(null)}
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
