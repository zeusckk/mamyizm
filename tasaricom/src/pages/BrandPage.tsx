import { Link } from 'react-router-dom'
import { setupSteps, useStore } from '../store'

export function BrandPage() {
  const { state } = useStore()
  const { brand } = state
  const setup = setupSteps(state)
  const brandSteps = setup.steps.filter((step) => ['name', 'sector', 'color', 'logo'].includes(step.id))
  const done = brandSteps.filter((step) => step.done).length
  const initial = (brand.name || 'M').slice(0, 1).toLocaleUpperCase('tr-TR')

  return (
    <div className="page page-wide">
      <div className="page-head">
        <div>
          <h1>Marka</h1>
          <p className="muted">Logo, renk ve ses bir kez durur. Her özel gün taslağı buradan kurulur.</p>
        </div>
        <Link to="/marka/kimlik" className="btn-accent" style={{ textDecoration: 'none' }}>
          Kimliği düzenle
        </Link>
      </div>

      <section className="card brand-hero">
        <div className="logo-slot lg">
          {brand.logoDataUrl ? <img src={brand.logoDataUrl} alt="" /> : initial}
        </div>
        <div className="grow">
          <div className="kicker">İŞLETME</div>
          <h2>{brand.name || 'İsimsiz marka'}</h2>
          <p className="muted">{brand.slogan || 'Slogan henüz yok.'}</p>
          <div className="swatches">
            <span className="swatch" style={{ background: brand.colors.primary }} title={brand.colors.primary} />
            <span className="swatch" style={{ background: brand.colors.secondary }} title={brand.colors.secondary} />
            <span className="muted">{brand.sector || 'Sektör seçilmedi'}</span>
          </div>
          <div className="chips" style={{ marginTop: 10 }}>
            {(brand.voice.length ? brand.voice : ['Ses seçilmedi']).map((voice) => (
              <span key={voice} className="chip">
                {voice}
              </span>
            ))}
          </div>
        </div>
        <div style={{ minWidth: 140 }}>
          <div className="kicker">
            KİMLİK {done}/{brandSteps.length}
          </div>
          <div className="meter">
            <span style={{ width: `${(done / brandSteps.length) * 100}%` }} />
          </div>
          <div className="muted" style={{ marginTop: 8 }}>
            {brand.website || 'Web sitesi yok'}
          </div>
        </div>
      </section>

      <div className="brand-layout">
        <section className="panel stack">
          <div className="kicker">EKSİKLER</div>
          <Row title="Marka kimliği" text="Logo, ad, renk, ses ve görsel stil" ok={done === brandSteps.length} to="/marka/kimlik" />
          <Row
            title="İçerik tercihleri"
            text={brand.voice.length ? brand.voice.join(', ') : 'Ses ve üslup henüz yok'}
            ok={brand.voice.length > 0}
            to="/marka/kimlik"
          />
          <Row
            title="Hesap ve fatura"
            text="Paket, kredi ve fatura bilgileri"
            ok={setup.steps.find((step) => step.id === 'invoice')?.done || false}
            to="/hesap"
          />
        </section>
        <section className="panel">
          <div className="kicker">TASLAK BUNLARI KULLANIR</div>
          <dl className="facts" style={{ marginTop: 12 }}>
            <div>
              <dt>Sektör</dt>
              <dd>{brand.sector || '—'}</dd>
            </div>
            <div>
              <dt>Dil</dt>
              <dd>{brand.language}</dd>
            </div>
            <div>
              <dt>Hitap</dt>
              <dd>{brand.audience || '—'}</dd>
            </div>
            <div>
              <dt>Ürün</dt>
              <dd>{brand.productFor || '—'}</dd>
            </div>
            <div>
              <dt>Görsel stil</dt>
              <dd>{brand.visualStyle || '—'}</dd>
            </div>
            <div>
              <dt>Kare</dt>
              <dd>{brand.model || '—'}</dd>
            </div>
            <div>
              <dt>Işık</dt>
              <dd>{brand.lighting || '—'}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  )
}

function Row({ title, text, ok, to }: { title: string; text: string; ok: boolean; to: string }) {
  return (
    <Link to={to} className="link-row">
      <span>
        <strong>{title}</strong>
        <div className="muted">{text}</div>
      </span>
      <span className={ok ? 'badge ok' : 'badge'}>{ok ? 'Tamam' : 'Eksik'}</span>
    </Link>
  )
}
