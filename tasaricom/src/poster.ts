import { occasionById } from './data'
import type { Brand, Design, PlanId } from './types'

const SIZES = {
  '4:5': [800, 1000],
  '1:1': [1000, 1000],
  '9:16': [900, 1600],
  '16:9': [1600, 900],
} as const

export const TEMPLATE_NAMES = ['Koyu çerçeve', 'Davet', 'Afiş', 'Renk bloğu'] as const

export function templateIndex(brand: Brand, occasionKind: string, variation: number): number {
  let base = occasionKind === 'milli' ? 0 : occasionKind === 'kutlama' ? 1 : occasionKind === 'ticari' ? 2 : 3
  if (brand.lighting === 'Dramatik') base = 0
  if (brand.voice.includes('Cesur') || brand.voice.includes('Eğlenceli')) base = 2
  if (brand.visualStyle === 'Düz renk') base = 3
  if (brand.visualStyle === 'Stüdyo' && occasionKind !== 'milli') base = 1
  return (base + variation) % 4
}

function esc(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    if (char === '&') return '&amp;'
    if (char === '<') return '&lt;'
    if (char === '>') return '&gt;'
    if (char === '"') return '&quot;'
    return '&apos;'
  })
}

function clip(value: string, max: number): string {
  const text = value.replace(/\s+/g, ' ').trim()
  if (text.length <= max) return text
  return `${text.slice(0, max - 1).trim()}…`
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2)
  if (parts.length === 0) return 'T'
  return parts.map((part) => part[0] || '').join('').toLocaleUpperCase('tr-TR')
}

function splitTitle(title: string): string[] {
  const text = title.trim()
  if (text.length <= 16) return [text]
  const mid = Math.floor(text.length / 2)
  let index = -1
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === ' ' && (index === -1 || Math.abs(i - mid) < Math.abs(index - mid))) index = i
  }
  if (index <= 0) return [text]
  return [text.slice(0, index), text.slice(index + 1)]
}

function headlineFor(design: Pick<Design, 'brief' | 'occasionId'>, short: string): string {
  if (design.occasionId === 'serbest' || design.occasionId === 'kampanya' || design.occasionId === 'yildonumu') {
    const brief = design.brief.replace(/\s+/g, ' ').trim()
    if (brief.length > 0 && brief.length <= 36) return brief
  }
  return short
}

function titleSize(lines: string[], width: number, height: number, maxWidth: number): number {
  const longest = Math.max(...lines.map((line) => line.length), 1)
  const byBox = Math.min(width, height) * (lines.length > 1 ? 0.09 : 0.112)
  const byLine = maxWidth / (longest * 0.54)
  return Math.round(Math.max(32, Math.min(byBox, byLine)))
}

function titleBlock(
  lines: string[],
  x: number,
  y: number,
  size: number,
  fill: string,
  anchor: 'start' | 'middle',
): string {
  const gap = size * 1.06
  const start = lines.length === 1 ? y : y - gap * 0.42
  return lines
    .map(
      (line, index) =>
        `<text x="${x}" y="${Math.round(start + index * gap)}" text-anchor="${anchor}" fill="${fill}" font-family="Fraunces, Georgia, serif" font-size="${size}" font-weight="560">${esc(line)}</text>`,
    )
    .join('')
}

function logoMark(
  brand: Brand,
  show: boolean,
  uid: string,
  x: number,
  y: number,
  r: number,
  plate: string,
  glyph: string,
): string {
  if (!show) return ''
  if (brand.logoDataUrl) {
    const id = `${uid}-logo`
    return `<clipPath id="${id}"><circle cx="${x}" cy="${y}" r="${r}"/></clipPath><circle cx="${x}" cy="${y}" r="${r + 3}" fill="${plate}"/><image href="${brand.logoDataUrl}" x="${x - r}" y="${y - r}" width="${r * 2}" height="${r * 2}" clip-path="url(#${id})" preserveAspectRatio="xMidYMid slice"/>`
  }
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="${plate}"/><text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" fill="${glyph}" font-family="Outfit, sans-serif" font-size="${Math.round(r * 0.72)}" font-weight="600">${esc(initials(brand.name))}</text>`
}

function watermark(
  show: boolean,
  x: number,
  y: number,
  fill: string,
  anchor: 'start' | 'end' = 'end',
): string {
  if (!show) return ''
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" fill="${fill}" font-family="Outfit, sans-serif" font-size="15" letter-spacing="1.5">tasarıcom</text>`
}

function textNode(
  x: number,
  y: number,
  fill: string,
  size: number,
  weight: number,
  value: string,
  anchor: 'start' | 'middle' | 'end' = 'start',
  tracking = 0,
): string {
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" fill="${fill}" font-family="Outfit, sans-serif" font-size="${size}" font-weight="${weight}" letter-spacing="${tracking}">${esc(value)}</text>`
}

export function posterSvg(design: Design, brand: Brand, plan: PlanId, uid: string): string {
  const [w, h] = SIZES[design.format]
  const occasion = occasionById(design.occasionId)
  const index = templateIndex(brand, occasion.kind, design.variation)
  const lines = splitTitle(clip(headlineFor(design, occasion.short), 42))
  const brandName = clip(brand.name.trim() || 'Marka adı', 28)
  const subline = clip(design.revisionLine || brand.slogan || occasion.title, 52)
  const kicker = occasion.kicker
  const primary = brand.colors.primary || '#1c1915'
  const secondary = brand.colors.secondary || '#c45c26'
  const pad = Math.round(Math.min(w, h) * 0.08)
  const mark = watermark(plan === 'deneme', pad, h - Math.round(h * 0.05), 'rgba(246,241,232,.55)', 'start')
  const markDark = watermark(plan === 'deneme', w - Math.round(w * 0.07), h - Math.round(h * 0.045), 'rgba(28,25,21,.45)')
  const body =
    index === 0
      ? darkFrame()
      : index === 1
        ? invite()
        : index === 2
          ? poster()
          : block()

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="100%" height="100%" role="img" aria-label="${esc(occasion.title)} tasarımı">${body}</svg>`

  function darkFrame(): string {
    const size = titleSize(lines, w, h, w - pad * 2)
    const ink = '#f6f1e8'
    return `
      <rect width="${w}" height="${h}" fill="#14171c"/>
      <rect width="${w}" height="${Math.max(8, Math.round(h * 0.012))}" fill="${secondary}"/>
      <rect x="${pad * 0.55}" y="${pad * 0.55}" width="${w - pad * 1.1}" height="${h - pad * 1.1}" fill="none" stroke="rgba(246,241,232,.18)"/>
      ${textNode(pad, Math.round(h * 0.18), secondary, Math.round(size * 0.28), 600, kicker, 'start', 3.2)}
      ${titleBlock(lines, pad, Math.round(h * 0.4), size, ink, 'start')}
      ${textNode(pad, Math.round(h * 0.7), ink, Math.round(size * 0.34), 600, brandName)}
      ${textNode(pad, Math.round(h * 0.7 + size * 0.48), 'rgba(246,241,232,.68)', Math.round(size * 0.24), 400, subline)}
      ${logoMark(brand, design.showLogo, uid, w - pad - 8, h - pad - 8, Math.round(Math.min(w, h) * 0.055), secondary, '#14171c')}
      ${mark}
    `
  }

  function invite(): string {
    const size = titleSize(lines, w, h, w - pad * 2)
    const r = Math.round(Math.min(w, h) * 0.2)
    return `
      <rect width="${w}" height="${h}" fill="#f6f1e7"/>
      <circle cx="${w - r * 0.2}" cy="${r * 0.15}" r="${r}" fill="${secondary}"/>
      <rect x="${pad}" y="${Math.round(h * 0.62)}" width="${Math.round(w * 0.18)}" height="8" fill="${primary}"/>
      ${textNode(pad, Math.round(h * 0.22), primary, Math.round(size * 0.26), 600, kicker, 'start', 3)}
      ${titleBlock(lines, pad, Math.round(h * 0.4), size, '#1c1915', 'start')}
      ${textNode(pad, Math.round(h * 0.68), '#1c1915', Math.round(size * 0.32), 600, brandName)}
      ${textNode(pad, Math.round(h * 0.68 + size * 0.46), '#6e685f', Math.round(size * 0.22), 400, subline)}
      ${logoMark(brand, design.showLogo, uid, pad + Math.round(Math.min(w, h) * 0.05), h - pad, Math.round(Math.min(w, h) * 0.055), primary, '#f6f1e7')}
      ${markDark}
    `
  }

  function poster(): string {
    const split = Math.round(w * 0.36)
    const size = titleSize(lines, w, h, w - split - pad * 1.6)
    const ink = readable(primary)
    return `
      <rect width="${w}" height="${h}" fill="#f7f4ee"/>
      <rect width="${split}" height="${h}" fill="${primary}"/>
      ${textNode(Math.round(split / 2), Math.round(h * 0.2), ink, Math.round(size * 0.24), 600, kicker, 'middle', 2.4)}
      ${textNode(Math.round(split / 2), Math.round(h * 0.78), ink, Math.round(size * 0.28), 600, brandName, 'middle')}
      ${logoMark(brand, design.showLogo, uid, split, Math.round(h * 0.5), Math.round(Math.min(w, h) * 0.06), secondary, readable(secondary))}
      ${titleBlock(lines, split + pad * 0.7, Math.round(h * 0.42), size, '#1c1915', 'start')}
      ${textNode(split + pad * 0.7, Math.round(h * 0.66), '#6e685f', Math.round(size * 0.24), 400, subline)}
      ${markDark}
    `
  }

  function block(): string {
    const size = titleSize(lines, w, h, w - pad * 2)
    const ink = readable(primary)
    const mute = ink === '#1c1915' ? 'rgba(28,25,21,.7)' : 'rgba(246,241,232,.75)'
    const r = Math.round(Math.min(w, h) * 0.34)
    return `
      <rect width="${w}" height="${h}" fill="${primary}"/>
      <circle cx="${w * 0.82}" cy="${h * 0.18}" r="${r}" fill="${secondary}" opacity="0.9"/>
      <circle cx="${w * 0.12}" cy="${h * 0.86}" r="${Math.round(r * 0.45)}" fill="${secondary}" opacity="0.45"/>
      ${textNode(w / 2, Math.round(h * 0.28), ink, Math.round(size * 0.26), 600, kicker, 'middle', 3.4)}
      ${titleBlock(lines, w / 2, Math.round(h * 0.46), size, ink, 'middle')}
      ${textNode(w / 2, Math.round(h * 0.68), ink, Math.round(size * 0.3), 600, brandName, 'middle')}
      ${textNode(w / 2, Math.round(h * 0.68 + size * 0.42), mute, Math.round(size * 0.2), 400, subline, 'middle')}
      ${logoMark(brand, design.showLogo, uid, w / 2, Math.round(h * 0.16), Math.round(Math.min(w, h) * 0.05), ink, primary)}
      ${watermark(plan === 'deneme', w - pad, h - Math.round(h * 0.045), mute)}
    `
  }
}

function readable(hex: string): string {
  const raw = hex.replace('#', '')
  if (raw.length !== 6) return '#f6f1e8'
  const r = Number.parseInt(raw.slice(0, 2), 16)
  const g = Number.parseInt(raw.slice(2, 4), 16)
  const b = Number.parseInt(raw.slice(4, 6), 16)
  const luma = (r * 299 + g * 587 + b * 114) / 1000
  return luma > 160 ? '#1c1915' : '#f6f1e8'
}

export function downloadPoster(svg: string, filename: string) {
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
