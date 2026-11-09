import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PosterFrame } from '../PosterFrame'
import { FORMATS, occasionById, planById } from '../data'
import { downloadPoster, posterSvg } from '../poster'
import { STATUS_LABEL, useStore } from '../store'
import type { Format } from '../types'

export function Workbench() {
  const { id = '' } = useParams()
  const store = useStore()
  const design = store.state.designs.find((item) => item.id === id)
  const [note, setNote] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  if (!design) {
    return (
      <div className="page">
        <h1>Bu tasarım yok</h1>
        <p className="muted">Silinmiş ya da bu tarayıcıda kayıtlı değil.</p>
        <Link to="/">Stüdyoya dön</Link>
      </div>
    )
  }

  const { brand, plan } = store.state
  const piece = design
  const occasion = occasionById(piece.occasionId)
  const editorLeft = planById(plan).editors - store.state.editorUsed
  const locked = piece.pending || piece.status === 'editor'

  function revise() {
    const text = note.trim()
    if (!text) return
    store.revise(piece.id, text)
    setNote('')
  }

  async function copyCaption() {
    try {
      await navigator.clipboard.writeText(piece.caption)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
      setError('Kopyalanamadı.')
    }
  }

  return (
    <div className="work">
      <section className="col">
        <Link to="/" className="muted">
          ← Stüdyo
        </Link>
        <div className="thread">
          {design.messages.map((message, index) => (
            <article key={`${message.at}-${index}`} className={`bubble ${message.role}`}>
              <div className="who-line">{message.role === 'user' ? 'Sen' : message.role === 'editor' ? 'Editör' : 'Stüdyo'}</div>
              {message.text}
            </article>
          ))}
          {design.pending ? (
            <article className="bubble studio">
              <div className="who-line">Stüdyo</div>
              Sahne kuruluyor. Marka renklerin ve gün aynı kareye geliyor.
            </article>
          ) : null}
        </div>
        <div className="chips">
          {FORMATS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={design.format === item.id ? 'chip on' : 'chip'}
              onClick={() => store.setFormat(design.id, item.id as Format)}
              disabled={design.pending}
            >
              {item.label}
            </button>
          ))}
        </div>
        <form
          className="composer"
          style={{ marginTop: 0 }}
          onSubmit={(event) => {
            event.preventDefault()
            revise()
          }}
        >
          <textarea
            data-testid="revise-note"
            value={note}
            disabled={locked}
            placeholder={locked ? 'Editör teslim edene kadar not beklesin.' : 'Başka bir şey ister misin?'}
            onChange={(event) => setNote(event.target.value)}
          />
          <div className="composer-foot">
            <span className="muted">{occasion.title}</span>
            <button className="icon-btn" type="submit" disabled={locked || !note.trim()} aria-label="Notu uygula">
              ↑
            </button>
          </div>
        </form>
      </section>

      <section className="col center-col">
        {design.pending ? (
          <div
            className="stage"
            data-testid="stage"
            style={{
              backgroundImage: `linear-gradient(120deg, ${brand.colors.primary}, ${brand.colors.secondary}, #f4efe6, ${brand.colors.primary})`,
            }}
          >
            <div>
              <strong>{brand.name || 'tasarıcom'}</strong>
              <span>Sahne kuruluyor</span>
            </div>
          </div>
        ) : (
          <PosterFrame design={design} brand={brand} plan={plan} />
        )}
      </section>

      <section className="col">
        <div className="panel stack">
          <div className="inline">
            <span className={`status ${design.status}`}>{design.pending ? 'Hazırlanıyor' : STATUS_LABEL[design.status]}</span>
            <span className="muted">Kalan kredi {store.state.credits}</span>
          </div>
          <label className="field">
            <span>Tasarım yazısı</span>
            <textarea
              data-testid="caption"
              value={design.caption}
              disabled={design.pending}
              placeholder="Metin, görsel hazır olunca yazılır."
              onChange={(event) => store.setCaption(design.id, event.target.value)}
            />
          </label>
          <button className="btn-line" type="button" disabled={design.pending || !design.caption} onClick={copyCaption}>
            {copied ? 'Kopyalandı' : 'Metni kopyala'}
          </button>
          <button className="btn-line" type="button" data-testid="vary-design" disabled={design.pending} onClick={() => store.vary(design.id)}>
            Varyasyon
          </button>
          <button className="btn-line" type="button" disabled={design.pending} onClick={() => store.toggleLogo(design.id)}>
            {design.showLogo ? 'Logoyu kaldır' : 'Logoyu ekle'}
          </button>
          <button
            className="btn-line"
            type="button"
            disabled={design.pending}
            onClick={() => downloadPoster(posterSvg(design, brand, plan, `${design.id}-file`), `tasaricom-${occasion.id}.svg`)}
          >
            SVG indir
          </button>
          {error ? <p className="form-error">{error}</p> : null}
          <p className="hint" style={{ margin: 0 }}>
            Editör hakkı: {Math.max(0, editorLeft)}
          </p>
          <button
            className="btn-line"
            type="button"
            data-testid="send-editor"
            disabled={design.pending || design.status === 'editor'}
            onClick={() => {
              const result = store.sendToEditor(design.id)
              setError(result.ok ? '' : result.reason || 'Gönderilemedi.')
            }}
          >
            Editöre gönder
          </button>
          <button
            className="btn-accent"
            type="button"
            data-testid="approve-design"
            disabled={design.pending || design.status === 'editor' || design.status === 'approved'}
            onClick={() => store.approve(design.id)}
          >
            {design.status === 'approved' ? 'Onaylandı' : 'Onayla'}
          </button>
          {design.editorNote ? <p className="hint">Editör notu: {design.editorNote}</p> : null}
        </div>
      </section>
    </div>
  )
}
