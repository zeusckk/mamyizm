import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react'
import { isoDate, makeCaption, planById, studioReply, occasionById } from './data'
import type { AppState, Billing, Brand, Design, Format, Invoice, PlanId, ThemeChoice } from './types'

const KEY = 'tasaricom.v1'

function uid(): string {
  return crypto.randomUUID()
}

function stamp() {
  return new Date().toISOString()
}

export function seedState(): AppState {
  const trial = new Date()
  trial.setDate(trial.getDate() + 7)
  return {
    v: 1,
    brand: {
      name: 'Mola Kahve',
      slogan: 'Bugün de uğra.',
      sector: 'Kafe & Restoran',
      website: 'molakahve.com',
      language: 'Türkçe',
      logoDataUrl: null,
      colors: { primary: '#243126', secondary: '#E6A15C' },
      voice: ['Samimi', 'Sıcak'],
      audience: 'Karma',
      productFor: 'Unisex',
      visualStyle: 'Lifestyle',
      model: 'Yazı odaklı',
      lighting: 'Doğal',
    },
    designs: [],
    invoice: {
      firstName: '',
      lastName: '',
      taxId: '',
      phone: '',
      address: '',
      city: '',
      country: 'Türkiye',
      postal: '',
    },
    bills: [],
    plan: 'deneme',
    billing: 'monthly',
    credits: 12,
    editorUsed: 0,
    trialEnds: isoDate(trial),
    theme: 'system',
  }
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return seedState()
    const parsed = JSON.parse(raw) as AppState
    if (parsed.v !== 1 || !parsed.brand || !Array.isArray(parsed.designs)) return seedState()
    return parsed
  } catch {
    return seedState()
  }
}

type Action =
  | { type: 'create'; design: Design }
  | { type: 'finish'; id: string }
  | { type: 'revise'; id: string; note: string }
  | { type: 'vary'; id: string }
  | { type: 'logo'; id: string }
  | { type: 'format'; id: string; format: Format }
  | { type: 'caption'; id: string; caption: string }
  | { type: 'editor'; id: string }
  | { type: 'approve'; id: string }
  | { type: 'deliver'; id: string; note: string }
  | { type: 'brand'; brand: Brand }
  | { type: 'invoice'; invoice: Invoice }
  | { type: 'plan'; plan: PlanId; billing: Billing }
  | { type: 'theme'; theme: ThemeChoice }
  | { type: 'reset' }

function patch(state: AppState, id: string, edit: (design: Design) => Design): AppState {
  return { ...state, designs: state.designs.map((design) => (design.id === id ? edit(design) : design)) }
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'create':
      if (state.credits < 1) return state
      return { ...state, credits: state.credits - 1, designs: [action.design, ...state.designs] }
    case 'finish':
      return patch(state, action.id, (design) => {
        if (!design.pending) return design
        const occasion = occasionById(design.occasionId)
        return {
          ...design,
          pending: false,
          caption: makeCaption(state.brand, occasion),
          messages: [
            ...design.messages,
            { role: 'studio', text: studioReply(state.brand, occasion), at: stamp() },
          ],
        }
      })
    case 'revise':
      return patch(state, action.id, (design) => ({
        ...design,
        pending: false,
        variation: design.variation + 1,
        revisionLine: action.note.slice(0, 90),
        status: 'draft',
        messages: [
          ...design.messages,
          { role: 'user', text: action.note, at: stamp() },
          {
            role: 'studio',
            text: 'Notu yerleşimin altına aldım ve başka bir düzen denedim.',
            at: stamp(),
          },
        ],
      }))
    case 'vary':
      return patch(state, action.id, (design) => ({
        ...design,
        variation: design.variation + 1,
        messages: [
          ...design.messages,
          { role: 'studio', text: 'Başka bir yerleşim denendi.', at: stamp() },
        ],
      }))
    case 'logo':
      return patch(state, action.id, (design) => ({ ...design, showLogo: !design.showLogo }))
    case 'format':
      return patch(state, action.id, (design) => ({ ...design, format: action.format }))
    case 'caption':
      return patch(state, action.id, (design) => ({ ...design, caption: action.caption }))
    case 'editor': {
      const limit = planById(state.plan).editors
      if (state.editorUsed >= limit) return state
      return {
        ...patch(state, action.id, (design) => ({
          ...design,
          status: 'editor',
          messages: [
            ...design.messages,
            { role: 'studio', text: 'İş editör kuyruğuna alındı. Teslim gelince burada açılır.', at: stamp() },
          ],
        })),
        editorUsed: state.editorUsed + 1,
      }
    }
    case 'approve':
      return patch(state, action.id, (design) => ({
        ...design,
        status: 'approved',
        messages: [...design.messages, { role: 'user', text: 'Tasarımı onayladım.', at: stamp() }],
      }))
    case 'deliver':
      return patch(state, action.id, (design) => ({
        ...design,
        status: 'delivered',
        editorNote: action.note,
        messages: [
          ...design.messages,
          {
            role: 'editor',
            text: action.note.trim() || 'Tasarımı teslim ettim. Onaylayabilir ya da not düşebilirsin.',
            at: stamp(),
          },
        ],
      }))
    case 'brand':
      return { ...state, brand: action.brand }
    case 'invoice':
      return { ...state, invoice: action.invoice }
    case 'plan': {
      const plan = planById(action.plan)
      const amount = action.billing === 'yearly' ? plan.monthly * 10 : plan.monthly
      return {
        ...state,
        plan: action.plan,
        billing: action.billing,
        credits: plan.credits,
        editorUsed: 0,
        bills: [
          {
            id: uid(),
            plan: action.plan,
            amount,
            at: stamp(),
            note: 'Demo kayıt. Ödeme alınmadı.',
          },
          ...state.bills,
        ],
      }
    }
    case 'theme':
      return { ...state, theme: action.theme }
    case 'reset':
      return seedState()
    default:
      return state
  }
}

export type SetupStep = { id: string; label: string; done: boolean; to: string }

export function setupSteps(state: AppState): { steps: SetupStep[]; done: number; next?: SetupStep } {
  const steps: SetupStep[] = [
    { id: 'name', label: 'İşletme adını yaz', done: state.brand.name.trim().length > 1, to: '/marka/kimlik' },
    { id: 'sector', label: 'Sektörünü seç', done: Boolean(state.brand.sector), to: '/marka/kimlik' },
    {
      id: 'color',
      label: 'Renklerini belirle',
      done: /^#[0-9a-fA-F]{6}$/.test(state.brand.colors.primary),
      to: '/marka/kimlik',
    },
    { id: 'logo', label: 'Logonu yükle', done: Boolean(state.brand.logoDataUrl), to: '/marka/kimlik' },
    { id: 'design', label: 'İlk tasarımı çıkar', done: state.designs.some((design) => !design.pending), to: '/' },
    {
      id: 'invoice',
      label: 'Fatura bilgisini gir',
      done: state.invoice.firstName.trim().length > 1 && state.invoice.taxId.trim().length > 5,
      to: '/hesap',
    },
  ]
  return { steps, done: steps.filter((step) => step.done).length, next: steps.find((step) => !step.done) }
}

export const STATUS_LABEL = {
  draft: 'Taslak',
  approved: 'Onaylandı',
  editor: 'Editörde',
  delivered: 'Teslim geldi',
} as const

type Store = {
  state: AppState
  createDesign: (input: {
    occasionId: string
    brief: string
    format: Format
    showLogo: boolean
    day: string
  }) => string | null
  revise: (id: string, note: string) => void
  vary: (id: string) => void
  toggleLogo: (id: string) => void
  setFormat: (id: string, format: Format) => void
  setCaption: (id: string, caption: string) => void
  sendToEditor: (id: string) => { ok: boolean; reason?: string }
  approve: (id: string) => void
  deliver: (id: string, note: string) => void
  saveBrand: (brand: Brand) => void
  saveInvoice: (invoice: Invoice) => void
  choosePlan: (plan: PlanId, billing: Billing) => void
  setTheme: (theme: ThemeChoice) => void
  reset: () => void
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load)

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(state))
  }, [state])

  useEffect(() => {
    const apply = () => {
      const dark =
        state.theme === 'dark' ||
        (state.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    }
    apply()
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [state.theme])

  const store: Store = {
    state,
    createDesign(input) {
      if (state.credits < 1) return null
      const id = uid()
      const design: Design = {
        id,
        occasionId: input.occasionId,
        day: input.day,
        brief: input.brief,
        format: input.format,
        variation: 0,
        showLogo: input.showLogo,
        caption: '',
        revisionLine: '',
        status: 'draft',
        pending: true,
        createdAt: stamp(),
        messages: [{ role: 'user', text: input.brief, at: stamp() }],
        editorNote: '',
      }
      dispatch({ type: 'create', design })
      window.setTimeout(() => dispatch({ type: 'finish', id }), 1300)
      return id
    },
    revise(id, note) {
      dispatch({ type: 'revise', id, note })
    },
    vary(id) {
      dispatch({ type: 'vary', id })
    },
    toggleLogo(id) {
      dispatch({ type: 'logo', id })
    },
    setFormat(id, format) {
      dispatch({ type: 'format', id, format })
    },
    setCaption(id, caption) {
      dispatch({ type: 'caption', id, caption })
    },
    sendToEditor(id) {
      const design = state.designs.find((item) => item.id === id)
      if (!design || design.pending) return { ok: false, reason: 'Taslak henüz hazır değil.' }
      if (design.status === 'editor') return { ok: false, reason: 'Bu iş zaten editörde.' }
      const limit = planById(state.plan).editors
      if (state.editorUsed >= limit) {
        return { ok: false, reason: 'Editör hakkın doldu. Plandan yükseltebilirsin.' }
      }
      dispatch({ type: 'editor', id })
      return { ok: true }
    },
    approve(id) {
      dispatch({ type: 'approve', id })
    },
    deliver(id, note) {
      dispatch({ type: 'deliver', id, note })
    },
    saveBrand(brand) {
      dispatch({ type: 'brand', brand })
    },
    saveInvoice(invoice) {
      dispatch({ type: 'invoice', invoice })
    },
    choosePlan(plan, billing) {
      dispatch({ type: 'plan', plan, billing })
    },
    setTheme(theme) {
      dispatch({ type: 'theme', theme })
    },
    reset() {
      localStorage.removeItem(KEY)
      dispatch({ type: 'reset' })
    },
  }

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}

export function useStore() {
  const value = useContext(Ctx)
  if (!value) throw new Error('Store yok')
  return value
}
