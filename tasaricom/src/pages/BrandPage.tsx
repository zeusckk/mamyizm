import { Link } from 'react-router-dom'
import { setupSteps, useStore } from '../store'

export function BrandPage() {
  const { state } = useStore()
  const { brand } = state
  const setup = setupSteps(state)
  const brandSteps = setup.steps.filter((step) => ['name', 'sector', 'color', 'logo'].includes(step.id))
  const done = brandSteps.filter((step) => step.done).length

  return (
    <div className="page" style={{ maxWidth: 760 }}>
      <div className="page-head">
        <div>
          <h1>Marka</h1>
          <p className="muted">Tasarıcom seni buradan tanır: logo, renk, ses ve sektör. Her taslak buna göre kurulur.</p>
        </div>
      </div>

      <div className="card inline" style={{ marginBottom: 12 }}>
        <div className="logo-slot">
          {brand.logoDataUrl ? <img src={brand.logoDataUrl} alt="" /> : (brand.name || 'M').slice(0, 1)}
        </div>
        <div className="grow">
          <strong>{brand.name || 'İsimsiz marka'}</strong>
          <div className="muted">{brand.website || 'Web sitesi yok'}</div>
        </div>
        <Link to="/marka/kimlik" className="btn-line" style={{ width: 'auto', textDecoration: 'none' }}>
          Düzenle
        </Link>
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="inline">
          <div className="grow">
            <strong>{brand.name || 'Marka adı eksik'}</strong>
            <div className="muted">{brand.sector || 'Sektör seçilmedi'}</div>
          </div>
          <span className="badge">
            {done}/{brandSteps.length}
          </span>
        </div>
        <div className="meter">
          <span style={{ width: `${(done / brandSteps.length) * 100}%` }} />
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 12 }}>
        <strong>Markanı tanıyalım</strong>
        <p className="muted">
          Web siten ve seçtiğin sektör, taslağın dilini belirler. Bu sürüm siteyi kendisi taramaz; kimlikte yazdığın bilgiler kullanılır.
        </p>
        <div className="muted">Web sitesi</div>
        <div className="input" style={{ marginTop: 6 }}>
          {brand.website || 'ornekmarka.com'}
        </div>
      </div>

      <div className="list">
        <Row title="Marka kimliği" text="Logo, ad, renk, ses ve görsel stil" ok={done === brandSteps.length} to="/marka/kimlik" />
        <Row title="İçerik tercihleri" text={brand.voice.length ? brand.voice.join(', ') : 'Ses ve üslup henüz yok'} ok={brand.voice.length > 0} to="/marka/kimlik" />
        <Row title="Hesap ve fatura" text="Paket, kredi ve fatura bilgileri" ok={setup.steps.find((step) => step.id === 'invoice')?.done || false} to="/hesap" />
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
