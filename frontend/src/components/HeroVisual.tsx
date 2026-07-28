'use client'
import { useI18n } from '@/lib/i18n'

/**
 * Cartão que simula uma fotografia do produto num dado ângulo.
 * O posicionamento fica no wrapper exterior; a animação no interior
 * (senão os keyframes de `transform` anulavam a posição).
 */
function PhotoCard({
  label,
  x,
  y,
  rotate,
  delay,
  z,
  flip = false,
}: {
  label: string
  x: number
  y: number
  rotate: number
  delay: string
  z: number
  flip?: boolean
}) {
  const id = label.replace(/\s/g, '')
  return (
    <div className="absolute" style={{ left: x, top: y, zIndex: z }}>
      <div className={`animate-float ${delay}`}>
        <div
          className="w-[86px] h-[106px] rounded-xl bg-white border border-gray-200 shadow-lg p-1.5"
          style={{ transform: `rotate(${rotate}deg)` }}
        >
          <div className="w-full h-[70px] rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <defs>
                <linearGradient id={`pg-${id}`} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#0369a1" />
                </linearGradient>
              </defs>
              <g transform={flip ? 'translate(100,0) scale(-1,1)' : undefined}>
                <ellipse cx="50" cy="86" rx="22" ry="4.5" fill="#0f172a" opacity="0.12" />
                <rect x="35" y="33" width="30" height="51" rx="8" fill={`url(#pg-${id})`} />
                <rect x="43" y="23" width="14" height="12" rx="4" fill="#075985" />
                <ellipse cx="44" cy="53" rx="4.5" ry="10" fill="#e0f2fe" opacity="0.5" />
              </g>
            </svg>
          </div>
          <p className="text-[9px] text-gray-500 font-medium mt-1 text-center">{label}</p>
        </div>
      </div>
    </div>
  )
}

/** Cubo 3D real (CSS transforms) que representa o modelo gerado. */
function Cube() {
  const S = 58 // meia-aresta
  const faces = [
    { t: `translateZ(${S}px)`, from: '#38bdf8', to: '#0284c7' },
    { t: `rotateY(180deg) translateZ(${S}px)`, from: '#0369a1', to: '#075985' },
    { t: `rotateY(90deg) translateZ(${S}px)`, from: '#0284c7', to: '#075985' },
    { t: `rotateY(-90deg) translateZ(${S}px)`, from: '#38bdf8', to: '#0369a1' },
    { t: `rotateX(90deg) translateZ(${S}px)`, from: '#bae6fd', to: '#7dd3fc' },
    { t: `rotateX(-90deg) translateZ(${S}px)`, from: '#075985', to: '#0c4a6e' },
  ]
  return (
    <div className="scene-3d">
      <div className="cube-3d animate-spin3d relative mx-auto" style={{ width: S * 2, height: S * 2 }}>
        {faces.map((f, i) => (
          <div
            key={i}
            className="cube-face rounded-lg"
            style={{
              transform: f.t,
              background: `linear-gradient(135deg, ${f.from}, ${f.to})`,
              boxShadow: 'inset 0 0 30px rgba(255,255,255,.22)',
              border: '1px solid rgba(255,255,255,.25)',
            }}
          />
        ))}
      </div>
      <div
        className="mx-auto rounded-[50%] bg-slate-900/20 blur-md"
        style={{ width: S * 1.7, height: 12, marginTop: 14 }}
      />
    </div>
  )
}

export default function HeroVisual() {
  const { t } = useI18n()
  return (
    <div className="w-full overflow-hidden">
      <div className="flex items-center justify-center gap-2 sm:gap-10 select-none scale-[0.72] sm:scale-100 origin-center">
        {/* Fotos de entrada */}
        <div className="relative w-[176px] h-[150px] shrink-0">
          <PhotoCard label={t('visual.front')} x={0} y={26} rotate={-10} delay="" z={1} />
          <PhotoCard label={t('visual.side')} x={45} y={4} rotate={2} delay="delay-200" z={2} flip />
          <PhotoCard label={t('visual.back')} x={90} y={32} rotate={11} delay="delay-300" z={3} />
        </div>

        {/* Seta */}
        <div className="flex flex-col items-center shrink-0">
          <svg width="30" height="16" viewBox="0 0 34 18" fill="none" className="animate-pulse-arrow text-brand-500">
            <path d="M0 9h28M22 2l7 7-7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[10px] font-semibold text-gray-400 tracking-wide mt-1.5">
            {t('visual.ai')}
          </span>
        </div>

        {/* Modelo 3D */}
        <div className="shrink-0">
          <Cube />
          <p className="text-[10px] font-medium text-gray-400 text-center mt-2.5">{t('visual.model')}</p>
        </div>
      </div>
    </div>
  )
}
