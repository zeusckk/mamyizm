import { useState } from 'react'
import { PLANS, formatMoney, planById, priceOf } from '../data'
import { useStore } from '../store'
import type { Billing, PlanId } from '../types'

const FAQ = [
  ['Kredisi bitince ne olur?', 'Yeni taslak çıkmaz. Paketi yükseltince haklar yenilenir. Bu demoda ödeme alınmaz.'],
  ['Editör ne yapar?', 'Aynı siparişi kuyrukta görür, yerleşimi değiştirir, not düşer ve teslim eder. Sen onaylarsın.'],
  ['Yapay zeka nerede?', 'Model henüz bağlı değil. Taslak; logo, renk, sektör ve özel günden kuruluyor. Model aynı stüdyo ekranına bağlanacak.'],
  ['Birden fazla marka?', 'Ajans paketinde çoklu marka duruyor. Bu sürüm tek markayı tutar.'],
  ['Fatura nasıl kesilir?', 'Hesaptaki bilgiler saklanır. Ödeme sağlayıcısı bağlanınca o bilgiler faturaya gider.'],
]

export function PlansPage() {
  const { state, choosePlan } = useStore()
  const [billing, setBilling] = useState<Billing>(state.billing)
  const [note, setNote] = useState('')
  const current = planById(state.plan)

  function pick(id: PlanId) {
    if (id === state.plan && billing === state.billing) {
      setNote('Bu plandasın.')
      return
    }
    choosePlan(id, billing)
    setNote(`${planById(id).name} plana geçildi. Ödeme bu demoda kapalı.`)
  }

  return (
    <div className="page">
      <div className="page-head" style={{ display: 'grid', justifyItems: 'center', textAlign: 'center' }}>
        <div>
          <h1>Planını seç</h1>
          <p className="muted">Markan için paketi seç. İstediğin zaman yükseltirsin. Bu demoda kart çekilmez.</p>
        </div>
      </div>
      <div className="chips" style={{ justifyContent: 'center' }}>
        <button type="button" className={billing === 'monthly' ? 'pill on' : 'pill'} onClick={() => setBilling('monthly')}>
          Aylık
        </button>
        <button type="button" className={billing === 'yearly' ? 'pill on' : 'pill'} onClick={() => setBilling('yearly')}>
          Yıllık · 2 ay bizden
        </button>
      </div>

      <article className="card" style={{ margin: '16px 0' }}>
        <div className="inline">
          <div className="grow">
            <div className="muted">Ücretsiz</div>
            <h2>Deneme</h2>
            <p className="muted">{PLANS[0].blurb}</p>
          </div>
          {state.plan === 'deneme' ? <span className="badge ok">Mevcut paket</span> : null}
        </div>
        <ul>
          {PLANS[0].points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
        <button className="btn-line" type="button" onClick={() => pick('deneme')}>
          {state.plan === 'deneme' ? 'Mevcut paket' : 'Denemeye dön'}
        </button>
      </article>

      <div className="plan-grid">
        {PLANS.filter((plan) => plan.id !== 'deneme').map((plan) => (
          <article key={plan.id} className={plan.recommended ? 'card plan rec' : 'card plan'}>
            {plan.recommended ? <span className="tag">Önerilen</span> : null}
            <div className="muted">{plan.name}</div>
            <div className="price">{formatMoney(priceOf(plan, billing))}</div>
            <div className="muted">{billing === 'yearly' ? '/ yıl' : '/ ay'} · KDV hariç</div>
            <p>{plan.blurb}</p>
            <ul>
              {plan.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <button className={plan.recommended ? 'btn-accent' : 'btn-line'} type="button" data-testid={`plan-${plan.id}`} onClick={() => pick(plan.id)}>
              {state.plan === plan.id ? 'Mevcut paket' : 'Bu plana geç'}
            </button>
          </article>
        ))}
      </div>
      {note ? <p className="credits-line">{note} Şu an: {current.name}.</p> : null}

      <section className="panel" style={{ marginTop: 22 }}>
        <h2 style={{ fontSize: 28, marginBottom: 8 }}>Sık sorulanlar</h2>
        {FAQ.map(([q, a]) => (
          <details key={q}>
            <summary>{q}</summary>
            <p className="muted">{a}</p>
          </details>
        ))}
      </section>
    </div>
  )
}
