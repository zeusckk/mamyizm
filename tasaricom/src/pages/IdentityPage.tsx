import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PosterFrame } from '../PosterFrame'
import { AUDIENCES, LIGHTS, MODELS, PRODUCT_FOR, SECTORS, STYLES, VOICES, nextOccasion } from '../data'
import { readLogo } from '../files'
import { useStore } from '../store'
import type { Brand, Design } from '../types'

export function IdentityPage() {
  const { state, saveBrand } = useStore()
  const [form, setForm] = useState<Brand>(state.brand)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const upcoming = nextOccasion()

  function set<K extends keyof Brand>(key: K, value: Brand[K]) {
    setSaved(false)
    setForm((current) => ({ ...current, [key]: value }))
  }

  function toggleVoice(voice: string) {
    setForm((current) => {
      const has = current.voice.includes(voice)
      if (has) return { ...current, voice: current.voice.filter((item) => item !== voice) }
      if (current.voice.length >= 3) return current
      return { ...current, voice: [...current.voice, voice] }
    })
    setSaved(false)
  }

  async function onLogo(file: File | undefined) {
    if (!file) return
    try {
      const logoDataUrl = await readLogo(file)
      set('logoDataUrl', logoDataUrl)
      setError('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Logo yüklenemedi.')
    }
  }

  const preview: Design = {
    id: 'kimlik-onizleme',
    occasionId: upcoming?.id || 'serbest',
    day: upcoming?.date || '',
    brief: form.slogan || 'Markanın için',
    format: '4:5',
    variation: 0,
    showLogo: true,
    caption: '',
    revisionLine: '',
    status: 'draft',
    pending: false,
    createdAt: '',
    messages: [],
    editorNote: '',
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <Link to="/marka" className="muted">
            ← Marka
          </Link>
          <h1>Marka kimliği</h1>
          <p className="muted">Bu bilgiler görsellerin ve metnin sana göre kurulmasını sağlar.</p>
        </div>
        <button
          className="btn-accent"
          type="button"
          data-testid="save-brand"
          onClick={() => {
            saveBrand(form)
            setSaved(true)
          }}
        >
          {saved ? 'Kaydedildi' : 'Kaydet'}
        </button>
      </div>

      <div className="identity">
        <div className="stack">
          <section className="panel stack">
            <div className="inline">
              <div className="logo-slot">
                {form.logoDataUrl ? <img src={form.logoDataUrl} alt="" /> : (form.name || 'M').slice(0, 1)}
              </div>
              <label className="btn-line" style={{ width: 'auto' }}>
                Logo yükle
                <input
                  data-testid="logo-input"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  hidden
                  onChange={(event) => onLogo(event.target.files?.[0])}
                />
              </label>
              {form.logoDataUrl ? (
                <button className="btn-ghost" type="button" onClick={() => set('logoDataUrl', null)}>
                  Kaldır
                </button>
              ) : null}
            </div>
            <p className="hint" style={{ margin: 0 }}>
              PNG, JPG veya WEBP. Şeffaf PNG en iyisi.
            </p>
            {error ? <p className="form-error">{error}</p> : null}
            <label className="field">
              <span>İşletme adı</span>
              <input data-testid="brand-name" value={form.name} onChange={(event) => set('name', event.target.value)} />
            </label>
            <label className="field">
              <span>Slogan</span>
              <input value={form.slogan} placeholder="Örn. Bugün de uğra." onChange={(event) => set('slogan', event.target.value)} />
            </label>
            <div className="field">
              <span>Sektör</span>
              <div className="choice-grid">
                {SECTORS.map((sector) => (
                  <button key={sector} type="button" className={form.sector === sector ? 'chip on' : 'chip'} onClick={() => set('sector', sector)}>
                    {sector}
                  </button>
                ))}
              </div>
            </div>
            <div className="two">
              <label className="field">
                <span>Web sitesi</span>
                <input value={form.website} onChange={(event) => set('website', event.target.value)} />
              </label>
              <label className="field">
                <span>İçerik dili</span>
                <select value={form.language} onChange={(event) => set('language', event.target.value)}>
                  <option>Türkçe</option>
                  <option>English</option>
                </select>
              </label>
            </div>
            <div className="two">
              <ColorField label="Ana renk" value={form.colors.primary} onChange={(primary) => set('colors', { ...form.colors, primary })} />
              <ColorField label="İkinci renk" value={form.colors.secondary} onChange={(secondary) => set('colors', { ...form.colors, secondary })} />
            </div>
          </section>
        </div>

        <div className="stack">
          <PosterFrame design={preview} brand={form} plan={state.plan} />
          <section className="panel stack">
            <div className="field">
              <span>Marka sesi · en fazla 3</span>
              <div className="choice-grid">
                {VOICES.map((voice) => (
                  <button key={voice} type="button" className={form.voice.includes(voice) ? 'chip on' : 'chip'} onClick={() => toggleVoice(voice)}>
                    {voice}
                  </button>
                ))}
              </div>
            </div>
            <Choice label="Kime konuşuyorsun?" options={AUDIENCES} value={form.audience} onChange={(audience) => set('audience', audience)} />
            <Choice label="Ürün kimin için?" options={PRODUCT_FOR} value={form.productFor} onChange={(productFor) => set('productFor', productFor)} />
            <Choice label="Görsel stil" options={STYLES} value={form.visualStyle} onChange={(visualStyle) => set('visualStyle', visualStyle)} />
            <Choice label="Karede ne var?" options={MODELS} value={form.model} onChange={(model) => set('model', model)} />
            <Choice label="Işık" options={LIGHTS} value={form.lighting} onChange={(lighting) => set('lighting', lighting)} />
          </section>
        </div>
      </div>
    </div>
  )
}

function Choice({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: string[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="field">
      <span>{label}</span>
      <div className="choice-grid">
        {options.map((option) => (
          <button key={option} type="button" className={value === option ? 'chip on' : 'chip'} onClick={() => onChange(option)}>
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="color-row">
        <input type="color" value={safeHex(value)} onChange={(event) => onChange(event.target.value.toUpperCase())} />
        <input
          value={value}
          onChange={(event) => {
            const next = event.target.value
            if (/^#?[0-9a-fA-F]{0,6}$/.test(next)) onChange(next.startsWith('#') ? next : `#${next}`)
          }}
        />
      </div>
    </label>
  )
}

function safeHex(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#243126'
}
