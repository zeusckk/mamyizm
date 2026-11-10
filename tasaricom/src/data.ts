import type { Billing, Brand, PlanId } from './types'

export type OccasionKind = 'milli' | 'kutlama' | 'ticari' | 'ozel'

export type Occasion = {
  id: string
  title: string
  short: string
  kicker: string
  date: string | null
  kind: OccasionKind
  note?: string
}

export const OCCASIONS: Occasion[] = [
  {
    id: '10-kasim',
    title: '10 Kasım',
    short: 'Saygı ve özlemle',
    kicker: '10 KASIM',
    date: '2026-11-10',
    kind: 'milli',
  },
  {
    id: 'ogretmenler',
    title: 'Öğretmenler Günü',
    short: 'İyi ki varsınız',
    kicker: '24 KASIM',
    date: '2026-11-24',
    kind: 'kutlama',
  },
  {
    id: 'yilbasi',
    title: 'Yılbaşı',
    short: 'İyi seneler',
    kicker: 'YENİ YIL',
    date: '2026-12-31',
    kind: 'kutlama',
  },
  {
    id: 'sevgililer',
    title: 'Sevgililer Günü',
    short: 'Birlikte güzel',
    kicker: '14 ŞUBAT',
    date: '2027-02-14',
    kind: 'ticari',
  },
  {
    id: 'kadinlar',
    title: '8 Mart',
    short: '8 Mart kutlu olsun',
    kicker: '8 MART',
    date: '2027-03-08',
    kind: 'kutlama',
    note: 'Aynı gün Ramazan Bayramı arifesi.',
  },
  {
    id: 'ramazan',
    title: 'Ramazan Bayramı',
    short: 'Bayramınız kutlu olsun',
    kicker: 'BAYRAM',
    date: '2027-03-09',
    kind: 'kutlama',
    note: 'Diyanet takviminde bayramın birinci günü.',
  },
  {
    id: '23-nisan',
    title: '23 Nisan',
    short: '23 Nisan kutlu olsun',
    kicker: '23 NİSAN',
    date: '2027-04-23',
    kind: 'milli',
  },
  {
    id: '1-mayis',
    title: '1 Mayıs',
    short: 'Emek ve dayanışma',
    kicker: '1 MAYIS',
    date: '2027-05-01',
    kind: 'milli',
  },
  {
    id: 'anneler',
    title: 'Anneler Günü',
    short: 'İyi ki varsın',
    kicker: 'ANNELER',
    date: '2027-05-09',
    kind: 'kutlama',
  },
  {
    id: 'kurban',
    title: 'Kurban Bayramı',
    short: 'Bayramınız mübarek olsun',
    kicker: 'BAYRAM',
    date: '2027-05-16',
    kind: 'kutlama',
    note: 'Diyanet takviminde birinci gün. 19 Mayıs, bayramın dördüncü günüyle çakışır.',
  },
  {
    id: '19-mayis',
    title: '19 Mayıs',
    short: 'Gençlik ve spor',
    kicker: '19 MAYIS',
    date: '2027-05-19',
    kind: 'milli',
  },
  {
    id: 'babalar',
    title: 'Babalar Günü',
    short: 'İyi ki varsın',
    kicker: 'BABALAR',
    date: '2027-06-20',
    kind: 'kutlama',
  },
  {
    id: '15-temmuz',
    title: '15 Temmuz',
    short: 'Saygıyla anıyoruz',
    kicker: '15 TEMMUZ',
    date: '2027-07-15',
    kind: 'milli',
  },
  {
    id: '30-agustos',
    title: '30 Ağustos',
    short: 'Zafer Bayramı',
    kicker: '30 AĞUSTOS',
    date: '2027-08-30',
    kind: 'milli',
  },
  {
    id: '29-ekim',
    title: 'Cumhuriyet Bayramı',
    short: 'Cumhuriyet Bayramı',
    kicker: '29 EKİM',
    date: '2027-10-29',
    kind: 'milli',
  },
  {
    id: 'yildonumu',
    title: 'Firma yıldönümü',
    short: 'Nice yıllara',
    kicker: 'YIL DÖNÜMÜ',
    date: null,
    kind: 'ozel',
  },
  {
    id: 'kampanya',
    title: 'Kampanya',
    short: 'Bu haftaya özel',
    kicker: 'KAMPANYA',
    date: null,
    kind: 'ticari',
  },
  {
    id: 'serbest',
    title: 'Serbest tasarım',
    short: 'Senin için',
    kicker: 'TASARIM',
    date: null,
    kind: 'ozel',
  },
]

export type Plan = {
  id: PlanId
  name: string
  monthly: number
  credits: number
  editors: number
  blurb: string
  points: string[]
  recommended?: boolean
}

export const PLANS: Plan[] = [
  {
    id: 'deneme',
    name: 'Deneme',
    monthly: 0,
    credits: 12,
    editors: 1,
    blurb: 'Markanı ve bir özel günü denemek için.',
    points: ['7 gün', '12 taslak', '1 editör denemesi', 'SVG teslimde küçük imza'],
  },
  {
    id: 'atolye',
    name: 'Atölye',
    monthly: 1490,
    credits: 40,
    editors: 4,
    blurb: 'Tek işletme, düzenli özel günler.',
    points: ['40 taslak / ay', '4 editör işi', 'İmzasız SVG', 'Özel gün takvimi'],
  },
  {
    id: 'marka',
    name: 'Marka',
    monthly: 2490,
    credits: 100,
    editors: 12,
    blurb: 'Sık kampanya ve bayram takvimi.',
    points: ['100 taslak / ay', '12 editör işi', 'İmzasız SVG', 'Öncelikli editör sırası'],
    recommended: true,
  },
  {
    id: 'ajans',
    name: 'Ajans',
    monthly: 4990,
    credits: 280,
    editors: 40,
    blurb: 'Çok iş çıkaran ekipler için.',
    points: ['280 taslak / ay', '40 editör işi', 'İmzasız SVG', 'Çoklu marka yakında'],
  },
]

export const SECTORS = [
  'Kafe & Restoran',
  'Moda & Tekstil',
  'Kuaför & Güzellik',
  'Takı & Aksesuar',
  'Emlak',
  'Klinik & Sağlık',
  'Eğitim',
  'E-ticaret',
  'Ev & Dekorasyon',
  'Diğer',
]

export const VOICES = [
  'Minimal',
  'Lüks',
  'Samimi',
  'Eğlenceli',
  'Profesyonel',
  'Güvenilir',
  'Cesur',
  'Sıcak',
  'Net',
  'Nazik',
]

export const STYLES = ['Stüdyo', 'Lifestyle', 'Sokak', 'Düz renk', 'Karışık']
export const MODELS = ['Yazı odaklı', 'Ürün var', 'Mekân var']
export const LIGHTS = ['Doğal', 'Stüdyo', 'Dramatik', 'Yumuşak']
export const AUDIENCES = ['Kadın', 'Erkek', 'Karma', 'Genç']
export const PRODUCT_FOR = ['Kadın', 'Erkek', 'Unisex', 'Çocuk']

export const FORMATS = [
  { id: '4:5' as const, label: '4:5' },
  { id: '1:1' as const, label: '1:1' },
  { id: '9:16' as const, label: '9:16' },
  { id: '16:9' as const, label: '16:9' },
]

export const WEEKDAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
export const MONTHS = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
]

export function occasionById(id: string): Occasion {
  return OCCASIONS.find((item) => item.id === id) ?? OCCASIONS[OCCASIONS.length - 1]
}

export function planById(id: PlanId): Plan {
  return PLANS.find((item) => item.id === id) ?? PLANS[0]
}

export function yearlyPrice(plan: Plan): number {
  return plan.monthly * 10
}

export function priceOf(plan: Plan, billing: Billing): number {
  return billing === 'yearly' ? yearlyPrice(plan) : plan.monthly
}

export function formatMoney(value: number): string {
  return `${new Intl.NumberFormat('tr-TR').format(value)} TL`
}

export function isoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseIso(value: string): Date {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function addDays(date: Date, amount: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

export function sameDay(a: Date, b: Date): boolean {
  return isoDate(a) === isoDate(b)
}

export function formatLong(value: string): string {
  return parseIso(value).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatShort(value: string): string {
  return parseIso(value).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })
}

export function weekOf(date: Date): Date[] {
  const day = (startOfDay(date).getDay() + 6) % 7
  const monday = addDays(startOfDay(date), -day)
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index))
}

export function monthCells(year: number, month: number): Array<Date | null> {
  const first = new Date(year, month, 1)
  const pad = (first.getDay() + 6) % 7
  const count = new Date(year, month + 1, 0).getDate()
  const cells: Array<Date | null> = Array.from({ length: pad }, () => null)
  for (let day = 1; day <= count; day += 1) cells.push(new Date(year, month, day))
  return cells
}

export function datedOccasions(): Occasion[] {
  return OCCASIONS.filter((item) => item.date).sort((a, b) =>
    (a.date || '').localeCompare(b.date || ''),
  )
}

export function nextOccasion(from = new Date()): Occasion | undefined {
  const today = isoDate(from)
  return datedOccasions().find((item) => (item.date || '') >= today)
}

export function occasionsOn(day: string): Occasion[] {
  return OCCASIONS.filter((item) => item.date === day)
}

export function daysUntil(value: string, from = new Date()): number {
  const target = startOfDay(parseIso(value)).getTime()
  const now = startOfDay(from).getTime()
  return Math.round((target - now) / 86400000)
}

export function makeCaption(brand: Brand, occasion: Occasion): string {
  const who = brand.name.trim() || 'Markan'
  const tag = brand.slogan.trim() ? ` ${brand.slogan.trim()}` : ''
  if (occasion.kind === 'milli') {
    return `${occasion.title}. ${occasion.short}. ${who}.${tag}`.trim()
  }
  if (occasion.id === 'kampanya') {
    return `${who} — ${occasion.short}.${tag}`.trim()
  }
  return `${occasion.short}. ${who}.${tag}`.trim()
}

export function suggestBrief(brand: Brand, occasion: Occasion): string {
  const tone = brand.sector ? `${brand.sector} diliyle ` : ''
  return `${occasion.title} için ${tone}sade bir görsel. Logom küçük ve net dursun. Renklerim kalsın, kalabalık yazı olmasın.`
}

export function studioReply(brand: Brand, occasion: Occasion): string {
  const name = brand.name.trim() || 'markan'
  return `Taslak hazır. ${name} için ${occasion.title} yerleşimi, renklerin ve logonla kuruldu. Beğenmezsen varyasyon dene, not düş ya da editöre bırak.`
}
