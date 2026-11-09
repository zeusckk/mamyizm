import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PosterFrame } from '../PosterFrame'
import { FORMATS, occasionById } from '../data'
import { useStore } from '../store'
import type { Format } from '../types'

export function EditorPage() {
  const { state, vary, toggleLogo, setFormat, deliver } = useStore()
  const queue = state.designs.filter((design) => design.status === 'editor' || design.status === 'delivered')
  const waiting = queue.filter((design) => design.status === 'editor')
  const [selected, setSelected] = useState(waiting[0]?.id || queue[0]?.id || '')
  const [note, setNote] = useState('Logoyu hizaladım, yazıyı kısalttım.')
  const design = queue.find((item) => item.id === selected) || waiting[0] || queue[0]

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Editör kuyruğu</h1>
          <p className="muted">Müşterinin gönderdiği iş burada. Aynı yerleşimi düzeltip teslim edersin. Bu demoda müşteri de sensin.</p>
        </div>
      </div>
      {queue.length === 0 ? (
        <div className="card empty">
          <div className="kicker">ATÖLYE</div>
          <h2>Kuyruk boş</h2>
          <p className="muted">Müşteri bir taslağı editöre bırakınca aynı poster burada açılır.</p>
          <ol className="steps">
            <li>1. Stüdyoda günü ve briefi seç</li>
            <li>2. Taslak hazır olunca “Editöre gönder”</li>
            <li>3. Yerleşimi düzelt, not düş, teslim et</li>
          </ol>
          <Link to="/" className="btn-accent" style={{ textDecoration: 'none' }}>
            Stüdyoya git
          </Link>
        </div>
      ) : (
        <div className="identity">
          <div className="list">
            {queue.map((item) => (
              <button
                key={item.id}
                type="button"
                className="link-row"
                style={{ textAlign: 'left', borderColor: item.id === design?.id ? 'var(--accent)' : undefined }}
                onClick={() => setSelected(item.id)}
              >
                <span>
                  <strong>
                    {state.brand.name} · {occasionById(item.occasionId).title}
                  </strong>
                  <div className="muted">{item.brief}</div>
                </span>
                <span className={`status ${item.status}`}>{item.status === 'editor' ? 'Bekliyor' : 'Teslim'}</span>
              </button>
            ))}
          </div>
          {design ? (
            <div className="stack">
              <PosterFrame design={design} brand={state.brand} plan={state.plan} />
              <div className="panel stack">
                <div className="chips">
                  {FORMATS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={design.format === item.id ? 'chip on' : 'chip'}
                      onClick={() => setFormat(design.id, item.id as Format)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <button className="btn-line" type="button" onClick={() => vary(design.id)}>
                  Yerleşimi değiştir
                </button>
                <button className="btn-line" type="button" onClick={() => toggleLogo(design.id)}>
                  {design.showLogo ? 'Logoyu kaldır' : 'Logoyu ekle'}
                </button>
                <label className="field">
                  <span>Teslim notu</span>
                  <textarea data-testid="editor-note" value={note} onChange={(event) => setNote(event.target.value)} />
                </label>
                <button
                  className="btn-accent"
                  type="button"
                  data-testid="deliver"
                  disabled={design.status !== 'editor'}
                  onClick={() => deliver(design.id, note.trim())}
                >
                  {design.status === 'editor' ? 'Teslim et' : 'Teslim edildi'}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
