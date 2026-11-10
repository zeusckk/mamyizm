import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MONTHS,
  WEEKDAYS,
  datedOccasions,
  daysUntil,
  formatShort,
  isoDate,
  monthCells,
  nextOccasion,
  occasionsOn,
  sameDay,
  weekOf,
} from '../data'
import { useStore } from '../store'

export function CalendarPage() {
  const navigate = useNavigate()
  const { state } = useStore()
  const [cursor, setCursor] = useState(() => new Date())
  const [mode, setMode] = useState<'week' | 'month'>('week')
  const week = weekOf(cursor)
  const today = new Date()
  const cells = monthCells(cursor.getFullYear(), cursor.getMonth())
  const upcoming = nextOccasion()

  function openDay(day: Date) {
    const key = isoDate(day)
    const occasion = occasionsOn(key)[0]
    if (occasion) navigate(`/?ozel=${occasion.id}`)
    else navigate(`/?gun=${key}`)
  }

  function shift(amount: number) {
    const next = new Date(cursor)
    if (mode === 'week') next.setDate(next.getDate() + amount * 7)
    else next.setMonth(next.getMonth() + amount)
    setCursor(next)
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Özel günler</h1>
          <p className="muted">Yaklaşan günü seç, stüdyo o günün briefiyle açılsın.</p>
        </div>
        <div className="chips">
          <button type="button" className={mode === 'week' ? 'pill on' : 'pill'} onClick={() => setMode('week')}>
            Hafta
          </button>
          <button type="button" className={mode === 'month' ? 'pill on' : 'pill'} onClick={() => setMode('month')}>
            Ay
          </button>
        </div>
      </div>

      <div className="week-head">
        <div className="inline">
          <button className="btn-line" type="button" onClick={() => shift(-1)} aria-label="Önceki">
            ‹
          </button>
          <strong className="nowrap">
            {mode === 'week' ? weekLabel(week) : `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`}
          </strong>
          <button className="btn-line" type="button" onClick={() => shift(1)} aria-label="Sonraki">
            ›
          </button>
        </div>
        <button className="btn-ghost" type="button" onClick={() => setCursor(new Date())}>
          Bugün
        </button>
      </div>

      {mode === 'week' ? (
        <div className="week">
          {week.map((day, index) => {
            const key = isoDate(day)
            const names = occasionsOn(key)
            const made = state.designs.filter((design) => design.day === key)
            return (
              <button key={key} type="button" className={sameDay(day, today) ? 'day today' : 'day'} onClick={() => openDay(day)}>
                <strong>
                  {WEEKDAYS[index]} {day.getDate()}
                </strong>
                {names.map((item) => (
                  <em key={item.id}>{item.title}</em>
                ))}
                {made.length > 0 ? <span className="muted">{made.length} tasarım</span> : <span className="muted">+ Tasarım ekle</span>}
              </button>
            )
          })}
        </div>
      ) : (
        <>
          <div className="month" style={{ marginTop: 14 }}>
            {WEEKDAYS.map((name) => (
              <div key={name} className="muted" style={{ textAlign: 'center' }}>
                {name}
              </div>
            ))}
          </div>
          <div className="month">
            {cells.map((day, index) =>
              day ? (
                <button key={isoDate(day)} type="button" className={sameDay(day, today) ? 'cell today' : 'cell'} onClick={() => openDay(day)}>
                  <b>{day.getDate()}</b>
                  {occasionsOn(isoDate(day)).map((item) => (
                    <small key={item.id}>{item.title}</small>
                  ))}
                </button>
              ) : (
                <div key={`empty-${index}`} className="cell empty" />
              ),
            )}
          </div>
        </>
      )}

      <section className="recent">
        <h2>Yaklaşanlar</h2>
        <div className="list" style={{ marginTop: 12 }}>
          {datedOccasions()
            .filter((item) => (item.date || '') >= isoDate(new Date()))
            .slice(0, 8)
            .map((item) => (
            <button key={item.id} type="button" className="link-row" onClick={() => navigate(`/?ozel=${item.id}`)}>
              <span>
                <strong>{item.title}</strong>
                <div className="muted">
                  {formatShort(item.date || '')}
                  {item.note ? ` · ${item.note}` : ''}
                </div>
              </span>
              <span className="badge">{labelFor(daysUntil(item.date || ''))}</span>
            </button>
          ))}
        </div>
        {upcoming ? null : <p className="muted">Takvimdeki günler bitti. Kampanya ve yıldönümü stüdyodan açılır.</p>}
      </section>
    </div>
  )
}

function weekLabel(week: Date[]) {
  const start = week[0]
  const end = week[6]
  if (start.getMonth() === end.getMonth()) {
    return `${start.getDate()}–${end.getDate()} ${MONTHS[end.getMonth()]}`
  }
  return `${start.getDate()} ${MONTHS[start.getMonth()]} – ${end.getDate()} ${MONTHS[end.getMonth()]}`
}

function labelFor(days: number) {
  if (days === 0) return 'Bugün'
  if (days === 1) return 'Yarın'
  return `${days} gün`
}
