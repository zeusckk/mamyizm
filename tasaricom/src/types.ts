export type Format = '4:5' | '1:1' | '9:16' | '16:9'
export type DesignStatus = 'draft' | 'approved' | 'editor' | 'delivered'
export type ThemeChoice = 'system' | 'light' | 'dark'
export type PlanId = 'deneme' | 'atolye' | 'marka' | 'ajans'
export type Billing = 'monthly' | 'yearly'
export type Author = 'user' | 'studio' | 'editor'

export type Brand = {
  name: string
  slogan: string
  sector: string
  website: string
  language: string
  logoDataUrl: string | null
  colors: { primary: string; secondary: string }
  voice: string[]
  audience: string
  productFor: string
  visualStyle: string
  model: string
  lighting: string
}

export type Message = {
  role: Author
  text: string
  at: string
}

export type Design = {
  id: string
  occasionId: string
  day: string
  brief: string
  format: Format
  variation: number
  showLogo: boolean
  caption: string
  revisionLine: string
  status: DesignStatus
  pending: boolean
  createdAt: string
  messages: Message[]
  editorNote: string
}

export type Invoice = {
  firstName: string
  lastName: string
  taxId: string
  phone: string
  address: string
  city: string
  country: string
  postal: string
}

export type Bill = {
  id: string
  plan: PlanId
  amount: number
  at: string
  note: string
}

export type AppState = {
  v: 1
  brand: Brand
  designs: Design[]
  invoice: Invoice
  bills: Bill[]
  plan: PlanId
  billing: Billing
  credits: number
  editorUsed: number
  trialEnds: string
  theme: ThemeChoice
}
