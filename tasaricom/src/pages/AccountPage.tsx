import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatLong, formatMoney, planById } from '../data'
import { useStore } from '../store'
import type { Invoice } from '../types'

export function AccountPage() {
  const { state, saveInvoice, reset } = useStore()
  const [form, setForm] = useState<Invoice>(state.invoice)
  const [saved, setSaved] = useState(false)
  const plan = planById(state.plan)
  const editorLeft = Math.max(0, plan.editors - state.editorUsed)

  function set<K extends keyof Invoice>(key: K, value: string) {
    setSaved(false)
    setForm((current) => ({ ...current, [key]: value }))
  }

  return (
    <div className="page" style={{ maxWidth: 820 }}>
      <div className="page-head">
        <div>
          <h1>Hesap ve fatura</h1>
          <p className="muted">Paketin, bu ayki hakkın ve fatura bilgilerin.</p>
        </div>
      </div>

      <section className="card" style={{ marginBottom: 14, background: 'linear-gradient(180deg, #fff8e8, var(--paper))' }}>
        <div className="inline">
          <div className="grow">
            <div className="muted">Mevcut paket</div>
            <h2>{plan.name}</h2>
          </div>
          <span className="badge ok">Aktif</span>
        </div>
        <div className="two" style={{ marginTop: 12 }}>
          <div className="input">
            <div className="muted">Dönem</div>
            <strong>{state.billing === 'yearly' ? 'Yıllık' : 'Aylık'}</strong>
          </div>
          <div className="input">
            <div className="muted">{state.plan === 'deneme' ? 'Deneme bitişi' : 'Yenileme'}</div>
            <strong>{formatLong(state.trialEnds)}</strong>
          </div>
        </div>
        <Link to="/planlar" className="btn-accent" style={{ display: 'inline-block', marginTop: 12, textDecoration: 'none' }}>
          Paketleri gör
        </Link>
      </section>

      <div className="stat-grid" style={{ marginBottom: 14 }}>
        <article className="card stat">
          <div className="muted">Üretim hakkı</div>
          <b>
            {state.credits}
            <span style={{ fontSize: 16, fontWeight: 500 }}> / {plan.credits}</span>
          </b>
          <div className="meter">
            <span style={{ width: `${Math.min(100, (state.credits / plan.credits) * 100)}%` }} />
          </div>
          <div className="muted">1 taslak = 1 hak</div>
        </article>
        <article className="card stat">
          <div className="muted">Editör hakkı</div>
          <b>
            {editorLeft}
            <span style={{ fontSize: 16, fontWeight: 500 }}> / {plan.editors}</span>
          </b>
          <div className="meter">
            <span style={{ width: `${Math.min(100, (editorLeft / plan.editors) * 100)}%` }} />
          </div>
          <div className="muted">Editöre gönderince bir hak düşer</div>
        </article>
      </div>

      <section className="panel" style={{ marginBottom: 14 }}>
        <h2 style={{ fontSize: 24 }}>Kayıtlar</h2>
        {state.bills.length === 0 ? (
          <p className="muted">Henüz kayıt yok. Bir paket seçince, ödemesiz demo satırı burada görünür.</p>
        ) : (
          <div className="list">
            {state.bills.map((bill) => (
              <div key={bill.id} className="link-row">
                <span>
                  <strong>{planById(bill.plan).name}</strong>
                  <div className="muted">
                    {formatLong(bill.at.slice(0, 10))} · {bill.note}
                  </div>
                </span>
                <strong>{formatMoney(bill.amount)}</strong>
              </div>
            ))}
          </div>
        )}
      </section>

      <form
        className="panel stack"
        onSubmit={(event) => {
          event.preventDefault()
          saveInvoice(form)
          setSaved(true)
        }}
      >
        <h2 style={{ fontSize: 24 }}>Fatura bilgileri</h2>
        <p className="muted" style={{ margin: 0 }}>
          Ödeme ve fatura için gerekir. Bilgiler bu tarayıcıda kalır.
        </p>
        <div className="two">
          <label className="field">
            <span>Ad</span>
            <input required value={form.firstName} onChange={(event) => set('firstName', event.target.value)} />
          </label>
          <label className="field">
            <span>Soyad</span>
            <input required value={form.lastName} onChange={(event) => set('lastName', event.target.value)} />
          </label>
        </div>
        <div className="two">
          <label className="field">
            <span>TCKN / VKN</span>
            <input data-testid="tax-id" required value={form.taxId} onChange={(event) => set('taxId', event.target.value)} />
          </label>
          <label className="field">
            <span>Telefon</span>
            <input value={form.phone} onChange={(event) => set('phone', event.target.value)} />
          </label>
        </div>
        <label className="field">
          <span>Açık adres</span>
          <textarea value={form.address} onChange={(event) => set('address', event.target.value)} />
        </label>
        <div className="two">
          <label className="field">
            <span>Şehir</span>
            <input value={form.city} onChange={(event) => set('city', event.target.value)} />
          </label>
          <label className="field">
            <span>Ülke</span>
            <input value={form.country} onChange={(event) => set('country', event.target.value)} />
          </label>
        </div>
        <label className="field">
          <span>Posta kodu</span>
          <input value={form.postal} onChange={(event) => set('postal', event.target.value)} />
        </label>
        <div className="inline">
          <span className="muted grow">Bilgiler bu cihazda saklanır.</span>
          <button className="btn-accent" type="submit" data-testid="save-invoice">
            {saved ? 'Kaydedildi' : 'Kaydet'}
          </button>
        </div>
      </form>

      <button
        className="btn-ghost"
        type="button"
        style={{ marginTop: 16 }}
        onClick={() => {
          if (window.confirm('Demo verisi silinsin mi? Marka, tasarımlar ve fatura sıfırlanır.')) reset()
        }}
      >
        Demoyu sıfırla
      </button>
    </div>
  )
}
