import { TEMPLATE_NAMES, posterSvg, templateIndex } from './poster'
import { occasionById } from './data'
import type { Brand, Design, PlanId } from './types'

export function PosterFrame({
  design,
  brand,
  plan,
}: {
  design: Design
  brand: Brand
  plan: PlanId
}) {
  const svg = posterSvg(design, brand, plan, design.id || 'preview')
  const occasion = occasionById(design.occasionId)
  const name = TEMPLATE_NAMES[templateIndex(brand, occasion.kind, design.variation)]
  return (
    <div className="poster-wrap">
      <div className="poster-frame" data-format={design.format} dangerouslySetInnerHTML={{ __html: svg }} />
      <p className="hint" style={{ textAlign: 'center' }}>
        {name} · {design.format}
        {plan === 'deneme' ? ' · deneme imzası açık' : ''}
      </p>
    </div>
  )
}

export function PosterThumb({ design, brand, plan }: { design: Design; brand: Brand; plan: PlanId }) {
  const svg = posterSvg(design, brand, plan, `thumb-${design.id}`)
  return <div className="thumb" dangerouslySetInnerHTML={{ __html: svg }} />
}
