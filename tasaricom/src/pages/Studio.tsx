import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { PosterThumb } from '../PosterFrame'
import {
  FORMATS,
  OCCASIONS,
  datedOccasions,
  daysUntil,
  formatShort,
  isoDate,
  nextOccasion,
  occasionById,
  planById,
  suggestBrief,
} from '../data'
import { STATUS_LABEL, useStore } from '../store'
import type { Format } from '../types'

export function Studio() {
  const { state, createDesign } = useStore()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const upcoming = nextOccasion()
  const [occasionId, setOccasionId] = useState(upcoming?.id ?? 'serbest')
  const [brief, setBrief] = useState('')
  const [format, setFormat] = useState<Format>('4:5')
  const [showLogo, setShowLogo] = useState(true)
  const [dayOverride, setDayOverride] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const occasion = occasionById(occasionId)
  const soon = datedOccasions().filter((item) => item.date && daysUntil(item.date) >= 0).slice(0, 5)

  useEffect(() => {
    const requested = params.get('ozel')
    const gun = params.get('gun')
    if (requested && OCCASIONS.some((item) => item.id === requested)) {
      const picked = occasionById(requested)
      setOccasionId(requested)
      setDayOverride(null)
      setBrief(suggestBrief(state.brand, picked))
      return
    }
    if (gun && /^\d{4}-\d{2}-\d{2}$/.test(gun)) {
      setOccasionId('serbest')
      setDayOverride(gun)
      setBrief(`${formatShort(gun)} için bir tasarım. Logom küçük ve net dursun.`)
    }
  }, [params, state.brand])

  function submit() {
    if (busy) return
    if (state.credits < 1) {
      setError('Kredin bitti. Plandan devam edebilirsin.')
      return
    }
    const text = brief.trim() || suggestBrief(state.brand, occasion)
    const day = occasion.date ?? dayOverride ?? isoDate(new Date())
    setBusy(true)
    const id = createDesign({ occasionId, brief: text, format, showLogo, day })
    if (!id) {
      setBusy(false)
      setError('Kredin bitti. Plandan devam edebilirsin.')
      return
    }
    navigate(`/studio/${id}`)
  }

  const left = upcoming?.date ? daysUntil(upcoming.date) : null
  const when = left === 0 ? 'Bugün' : left === 1 ? 'Yarın' : left != null ? `${left} gün sonra` : ''

  return (
    <div className="studio-home">
      <div className="eyebrow">
        <span className="pill on">Görsel</span>
      </div>
      <h1>Hangi gün için tasarlayalım?</h1>
      <p className="lede">Özel günü seç. Taslak, logon ve renklerinle hazırlanır. İstersen editör aynı işi devralır.</p>
      <p className="credits-line">
        Kalan {state.credits} / {planById(state.plan).credits} taslak
      </p>

      <div className="occ-row" style={{ justifyContent: 'center', marginTop: 16 }}>
        {soon.map((item) => (
          <button
            key={item.id}
            type="button"
            className={item.id === occasionId ? 'chip on' : 'chip'}
            onClick={() => {
              setOccasionId(item.id)
              setDayOverride(null)
            }}
          >
            {item.title}
          </button>
        ))}
        <button type="button" className={occasionId === 'kampanya' ? 'chip on' : 'chip'} onClick={() => setOccasionId('kampanya')}>
          Kampanya
        </button>
        <button type="button" className={occasionId === 'yildonumu' ? 'chip on' : 'chip'} onClick={() => setOccasionId('yildonumu')}>
          Yıldönümü
        </button>
      </div>

      <form
        className="composer"
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
      >
        <div className="composer-label">
          <Spark /> Ne oluşturalım?
        </div>
        <textarea
          data-testid="studio-brief"
          value={brief}
          placeholder="Örn. 10 Kasım için sade bir anma görseli. Logom altta, küçük dursun."
          onChange={(event) => setBrief(event.target.value)}
        />
        <div className="composer-foot">
          <div className="chips">
            {FORMATS.map((item) => (
              <button key={item.id} type="button" className={format === item.id ? 'chip on' : 'chip'} onClick={() => setFormat(item.id)}>
                {item.label}
              </button>
            ))}
            <button type="button" className={showLogo ? 'chip on' : 'chip'} onClick={() => setShowLogo((value) => !value)}>
              Logo
            </button>
            <span className="chip">{occasion.title}</span>
          </div>
          <button className="icon-btn" type="submit" data-testid="studio-submit" disabled={busy || state.credits < 1} aria-label="Taslağı hazırla">
            <Arrow />
          </button>
        </div>
      </form>
      {error ? <p className="form-error">{error}</p> : null}
      <div className="chips" style={{ marginTop: 12 }}>
        <button type="button" className="chip" onClick={() => applyQuick('10-kasim')}>
          10 Kasım görseli
        </button>
        <button type="button" className="chip" onClick={() => applyQuick('ramazan')}>
          Bayram tebriği
        </button>
        <button type="button" className="chip" onClick={() => applyQuick('kampanya')}>
          Kampanyayı duyur
        </button>
        <button
          type="button"
          className="chip"
          onClick={() => setBrief(suggestBrief(state.brand, occasion))}
        >
          Bana bir yön ver
        </button>
      </div>
      <p className="hint">
        Yapay zeka modeli bu sürümde bağlı değil. Taslak, marka kimliğinden kuruluyor. Editör aynı siparişi teslim edebilir.
      </p>

      {upcoming && left != null ? (
        <div className="callout">
          <div>
            <strong>
              {when} {upcoming.title}
            </strong>
            <div className="muted">{formatShort(upcoming.date || '')}. Bu gün için bir tasarım hazırla.</div>
          </div>
          <button
            className="btn-accent"
            type="button"
            onClick={() => {
              setOccasionId(upcoming.id)
              setBrief(suggestBrief(state.brand, upcoming))
            }}
          >
            Günü seç
          </button>
        </div>
      ) : null}

      {state.designs.length > 0 ? (
        <section className="recent">
          <h2>Son tasarımlar</h2>
          <div className="design-grid">
            {state.designs.slice(0, 3).map((design) => (
              <Link key={design.id} to={`/studio/${design.id}`} className="design-card">
                <PosterThumb design={design} brand={state.brand} plan={state.plan} />
                <div className="meta">
                  <strong>{occasionById(design.occasionId).title}</strong>
                  <small>{STATUS_LABEL[design.status]}</small>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )

  function applyQuick(id: string) {
    const picked = occasionById(id)
    setOccasionId(id)
    setBrief(suggestBrief(state.brand, picked))
  }
}

function Spark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3l1.6 5.2L19 10l-5.4 1.8L12 17l-1.6-5.2L5 10l5.4-1.8L12 3z" />
    </svg>
  )
}
function Arrow() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 19V5M6 11l6-6 6 6" />
    </svg>
  )
}
