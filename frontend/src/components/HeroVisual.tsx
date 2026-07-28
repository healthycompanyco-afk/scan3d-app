'use client'
import { useI18n } from '@/lib/i18n'

/* ---------- Fotos de entrada ---------- */

/**
 * Cartão que simula uma fotografia do produto num dado ângulo.
 * O posicionamento fica no wrapper exterior e a animação no interior
 * (senão os keyframes de `transform` anulavam a posição).
 */
function PhotoCard({
  label, x, y, rotate, delay, z, flip = false,
}: {
  label: string; x: number; y: number; rotate: number; delay: string; z: number; flip?: boolean
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

/* ---------- Garrafa 3D (mesmo produto das fotos) ---------- */

const DARK = [7, 89, 133]     // #075985
const LIGHT = [125, 211, 252] // #7dd3fc

/**
 * Interpola entre o tom escuro e o claro (sombreado cilíndrico).
 * O piso em 0.2 evita que as faces laterais fiquem demasiado escuras
 * face às fotos de entrada.
 */
function shade(t: number, dim = 1) {
  const lifted = 0.2 + 0.8 * t
  const c = DARK.map((d, i) => Math.round((d + (LIGHT[i] - d) * lifted) * dim))
  return `rgb(${c[0]},${c[1]},${c[2]})`
}

/**
 * Cilindro em CSS 3D: N faces planas dispostas em círculo.
 * A cor de cada face varia com o ângulo, o que dá o volume cilíndrico.
 */
function Cylinder({
  r, h, n, top, containerWidth, dim = 1, radiusClass = '',
}: {
  r: number; h: number; n: number; top: number; containerWidth: number; dim?: number; radiusClass?: string
}) {
  const faceW = (2 * Math.PI * r) / n + 1.2 // +overlap para não haver frestas
  return (
    <div
      className="absolute cube-3d"
      style={{ top, left: containerWidth / 2 - r, width: r * 2, height: h }}
    >
      {Array.from({ length: n }).map((_, i) => {
        const angle = (i / n) * 360
        const t = (Math.cos((angle * Math.PI) / 180) + 1) / 2
        return (
          <div
            key={i}
            className={`absolute ${radiusClass}`}
            style={{
              width: faceW,
              height: h,
              left: r - faceW / 2,
              top: 0,
              background: `linear-gradient(to bottom, ${shade(t, dim)}, ${shade(t * 0.78, dim * 0.92)})`,
              transform: `rotateY(${angle}deg) translateZ(${r}px)`,
            }}
          />
        )
      })}
    </div>
  )
}

/** Tampo circular (disco) no topo de um cilindro. */
function Disc({ r, top, containerWidth, color }: { r: number; top: number; containerWidth: number; color: string }) {
  return (
    <div
      className="absolute rounded-full"
      style={{
        width: r * 2,
        height: r * 2,
        top: top - r,
        left: containerWidth / 2 - r,
        background: color,
        transform: 'rotateX(90deg)',
      }}
    />
  )
}

function Bottle() {
  const W = 76           // largura do contentor
  const H = 142          // altura total
  const bodyR = 34, bodyH = 74
  const neckR = 12, neckH = 21
  const capR = 14, capH = 15

  // Afunilamento do gargalo para o corpo, em passos pequenos (ombros suaves)
  const shoulder = [16, 21, 26, 30, 33]
  const shoulderH = 6
  const shoulderTop = capH + neckH

  return (
    <div className="scene-3d">
      <div
        className="cube-3d animate-spin3d relative mx-auto"
        style={{ width: W, height: H }}
      >
        {/* tampa */}
        <Cylinder r={capR} h={capH} n={14} top={0} containerWidth={W} dim={0.66} />
        <Disc r={capR} top={0} containerWidth={W} color={shade(0.6, 0.66)} />
        {/* gargalo */}
        <Cylinder r={neckR} h={neckH} n={14} top={capH} containerWidth={W} dim={0.9} />
        {/* ombros */}
        {shoulder.map((r, i) => (
          <Cylinder
            key={r}
            r={r}
            h={shoulderH + 1}
            n={18}
            top={shoulderTop + i * shoulderH}
            containerWidth={W}
          />
        ))}
        {/* corpo */}
        <Cylinder
          r={bodyR}
          h={bodyH}
          n={22}
          top={shoulderTop + shoulder.length * shoulderH}
          containerWidth={W}
          radiusClass="rounded-b-[3px]"
        />
      </div>
      {/* sombra de contacto */}
      <div
        className="mx-auto rounded-[50%] bg-slate-900/25 blur-md"
        style={{ width: bodyR * 1.9, height: 12, marginTop: 10 }}
      />
    </div>
  )
}

/* ---------- Composição ---------- */

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

        {/* Modelo 3D gerado — a mesma garrafa das fotos */}
        <div className="shrink-0">
          <Bottle />
          <p className="text-[10px] font-medium text-gray-400 text-center mt-2.5">{t('visual.model')}</p>
        </div>
      </div>
    </div>
  )
}
