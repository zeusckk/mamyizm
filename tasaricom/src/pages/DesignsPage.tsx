import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PosterThumb } from '../PosterFrame'
import { formatShort, occasionById } from '../data'
import { STATUS_LABEL, useStore } from '../store'
import type { DesignStatus } from '../types'

const FILTERS: Array<{ id: 'all' | DesignStatus; label: string }> = [
  { id: 'all', label: 'Tümü' },
  { id: 'draft', label: 'Taslak' },
  { id: 'editor', label: 'Editörde' },
  { id: 'delivered', label: 'Teslim' },
  { id: 'approved', label: 'Onaylı' },
]

export function DesignsPage() {
  const { state } = useStore()
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('all')
  const items = state.designs.filter((design) => filter === 'all' || design.status === filter)

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Tasarımlarım</h1>
          <p className="muted">{state.designs.length} iş. Taslak, editör ve onay burada durur.</p>
        </div>
        <Link to="/" className="btn-accent" style={{ textDecoration: 'none' }}>
          Yeni tasarım
        </Link>
      </div>
      <div className="chips">
        {FILTERS.map((item) => (
          <button key={item.id} type="button" className={filter === item.id ? 'chip on' : 'chip'} onClick={() => setFilter(item.id)}>
            {item.label}
          </button>
        ))}
      </div>
      {items.length === 0 ? (
        <div className="card empty">
          <div className="kicker">GALERİ</div>
          <h2>Henüz tasarım yok</h2>
          <p className="muted">Stüdyoda bir özel gün seç. Taslak, logon ve renklerinle burada birikir.</p>
          <Link to="/" className="btn-accent" style={{ textDecoration: 'none' }}>
            Stüdyoya git
          </Link>
        </div>
      ) : (
        <div className="design-grid">
          {items.map((design) => (
            <Link key={design.id} to={`/studio/${design.id}`} className="design-card" data-testid="design-card">
              {design.pending ? (
                <div className="thumb" style={{ aspectRatio: '4 / 5', display: 'grid', placeItems: 'center' }}>
                  Hazırlanıyor
                </div>
              ) : (
                <PosterThumb design={design} brand={state.brand} plan={state.plan} />
              )}
              <div className="meta">
                <strong>{occasionById(design.occasionId).title}</strong>
                <small>{design.day ? formatShort(design.day) : 'Tarihsiz'}</small>
                <span className={`status ${design.status}`}>{design.pending ? 'Hazırlanıyor' : STATUS_LABEL[design.status]}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
