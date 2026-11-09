import { format } from 'date-fns'
import { useState } from 'react'
import type { Crop } from '../../../domain/crops/types'
import type { CropSchedule } from '../../../domain/schedule/calculateSchedule'
import { formatDate, formatWindow } from '../../../shared/formatDate'
import {
  buildCropTimeline,
  isInScale,
  monthColumns,
  monthScale,
  percentOf,
  type BarKind,
  type CropTimeline as CropTimelineModel,
  type MonthColumn,
  type TimeScale,
} from './timeline'
import './CropTimeline.css'

export interface TimelineEntry {
  key: string
  crop: Crop
  schedule: CropSchedule
}

const LEGEND: { kind: BarKind; text: string }[] = [
  { kind: 'flat', text: 'Almácigo 1' },
  { kind: 'pricking', text: 'Almácigo 2' },
  { kind: 'bed', text: 'En la cama' },
  { kind: 'harvest', text: 'Cosecha' },
]

const anchorLabel = (schedule: CropSchedule) =>
  schedule.method === 'direct' ? 'Siembra directa' : 'Trasplante'

/** Franjas de los meses alternos, para leer los meses como columnas. */
function MonthBands({ columns }: { columns: MonthColumn[] }) {
  return columns.map((column, index) =>
    index % 2 === 1 ? (
      <span
        key={column.date}
        className="timeline-band"
        style={{ left: `${column.left}%`, width: `${column.width}%` }}
      />
    ) : null,
  )
}

function Track({
  timeline,
  scale,
  columns,
  todayLeft,
}: {
  timeline: CropTimelineModel
  scale: TimeScale
  columns: MonthColumn[]
  todayLeft: number | null
}) {
  const anchorLeft = percentOf(timeline.anchor, scale)
  const afterBarsEnd = Math.max(
    anchorLeft,
    ...timeline.bars.filter((bar) => bar.from >= timeline.anchor).map((bar) => percentOf(bar.to, scale)),
  )
  return (
    // Decorativa: las fechas van en texto debajo y en la tabla.
    <div className="timeline-track" aria-hidden="true">
      <MonthBands columns={columns} />
      {timeline.bars.map((bar) => {
        const left = percentOf(bar.from, scale)
        return (
          <span
            key={bar.label}
            className={`timeline-bar timeline-bar--${bar.kind}`}
            style={{ left: `${left}%`, width: `${Math.max(0.6, percentOf(bar.to, scale) - left)}%` }}
          >
            <span className="timeline-bar-label">{bar.label}</span>
            <span className="timeline-bar-short">{bar.shortLabel}</span>
          </span>
        )
      })}
      {timeline.missingBefore && (
        <span className="timeline-missing" style={{ right: `${100 - anchorLeft}%` }}>
          Sin dato
        </span>
      )}
      {timeline.missingAfter &&
        (afterBarsEnd > anchorLeft ? (
          // Falta la cosecha pero hay barra en la cama: el aviso va al final de esa barra.
          <span
            className="timeline-missing timeline-missing--inside"
            style={{ right: `${100 - afterBarsEnd}%` }}
          >
            Sin dato
          </span>
        ) : (
          <span className="timeline-missing" style={{ left: `${anchorLeft}%` }}>
            Sin dato
          </span>
        ))}
      <span className="timeline-anchor" style={{ left: `${anchorLeft}%` }} />
      {todayLeft !== null && <span className="timeline-today" style={{ left: `${todayLeft}%` }} />}
    </div>
  )
}

function Summary({ timeline, schedule }: { timeline: CropTimelineModel; schedule: CropSchedule }) {
  const harvest = timeline.bars.find((bar) => bar.kind === 'harvest')
  return (
    <p className="timeline-summary">
      <span>
        <span className="timeline-diamond" aria-hidden="true" /> {anchorLabel(schedule)}{' '}
        <strong className="date">{formatDate(timeline.anchor)}</strong>
      </span>
      {harvest ? (
        <span>
          <span className="timeline-chip timeline-chip--harvest" aria-hidden="true" /> Cosecha{' '}
          <strong className="date">
            {formatWindow({ earliest: harvest.from, latest: harvest.to })}
          </strong>
        </span>
      ) : (
        timeline.missingAfter && (
          <span className="timeline-muted">Cosecha: el libro no da el dato</span>
        )
      )}
    </p>
  )
}

/** Una barra por hortaliza sobre un eje de meses común, con el trasplante como ancla. */
export function CropTimeline({ entries }: { entries: TimelineEntry[] }) {
  // La fecha de hoy se toma una vez al mostrar la sección.
  const [today] = useState(() => format(new Date(), 'yyyy-MM-dd'))
  const items = entries.map((entry) => ({
    ...entry,
    timeline: buildCropTimeline(entry.crop, entry.schedule),
  }))
  const from = items.map((i) => i.timeline.earliest).reduce((a, b) => (a < b ? a : b))
  const to = items.map((i) => i.timeline.latest).reduce((a, b) => (a > b ? a : b))
  const scale = monthScale(from, to)
  const columns = monthColumns(scale)
  // Una columna final muy angosta (planes de años) no tiene espacio para su nombre.
  const minLabelWidth = 50 / columns.length
  const todayLeft = isInScale(today, scale) ? percentOf(today, scale) : null

  return (
    <div className="timeline">
      <ul className="timeline-legend" aria-label="Leyenda">
        {LEGEND.map((item) => (
          <li key={item.kind}>
            <span className={`timeline-chip timeline-chip--${item.kind}`} aria-hidden="true" />
            {item.text}
          </li>
        ))}
        <li>
          <span className="timeline-diamond" aria-hidden="true" />
          Trasplante o siembra directa
        </li>
      </ul>
      <p className="timeline-note">
        Cada barra abarca todo el periodo posible según el libro. Las fechas exactas están en la
        tabla.
      </p>

      <div className="timeline-axis" aria-hidden="true">
        <span className="timeline-axis-spacer" />
        <div className="timeline-axis-track">
          <MonthBands columns={columns} />
          {columns.map((column) => (
            <span
              key={column.date}
              className="timeline-month"
              style={{ left: `${column.left}%`, width: `${column.width}%` }}
            >
              {column.width >= minLabelWidth && (
                <>
                  <span className="timeline-month-label">{column.label}</span>
                  <span className="timeline-month-initial">{column.initial}</span>
                </>
              )}
            </span>
          ))}
          {todayLeft !== null && (
            <span className="timeline-today timeline-today--flag" style={{ left: `${todayLeft}%` }}>
              <span className="timeline-today-label">Hoy</span>
            </span>
          )}
        </div>
      </div>

      <ol className="timeline-rows">
        {items.map(({ key, crop, schedule, timeline }) => (
          <li key={key} className="timeline-row">
            <h3 className="timeline-name">{crop.name}</h3>
            <Track timeline={timeline} scale={scale} columns={columns} todayLeft={todayLeft} />
            <Summary timeline={timeline} schedule={schedule} />
          </li>
        ))}
      </ol>
    </div>
  )
}
