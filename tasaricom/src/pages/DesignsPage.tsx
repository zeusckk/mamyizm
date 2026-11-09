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
          <p className="muted">Üretilenler, editöre gidenler ve onayladıkların.</p>
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
        <div className="card" style={{ marginTop: 16 }}>
          <strong>Henüz tasarım yok.</strong>
          <p className="muted">Stüdyoda bir özel gün seçip ilk taslağı çıkar.</p>
          <Link to="/">Stüdyoya git</Link>
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
                <small>
                  {design.day ? formatShort(design.day) : 'Tarihsiz'} · {design.pending ? 'Hazırlanıyor' : STATUS_LABEL[design.status]}
                </small>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
