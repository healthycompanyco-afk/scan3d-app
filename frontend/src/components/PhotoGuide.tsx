'use client'
import { ReactNode } from 'react'
import { useI18n } from '@/lib/i18n'

/**
 * Guia visual de como fotografar o produto para obter o melhor modelo 3D.
 * Diagrama de ângulos + exemplos ilustrados (bom vs mau) desenhados em SVG.
 */

const ANGLES = [
  { emoji: '📸', key: 'guide.front' },
  { emoji: '↩️', key: 'guide.left' },
  { emoji: '↪️', key: 'guide.right' },
  { emoji: '🔄', key: 'guide.back' },
  { emoji: '⬆️', key: 'guide.top' },
  { emoji: '⬇️', key: 'guide.bottom' },
]

/** Moldura de "foto" com um veredicto (bom/mau) */
function Shot({ good, label, children }: { good: boolean; label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`relative rounded-lg overflow-hidden border-2 ${
          good ? 'border-green-500' : 'border-red-400'
        }`}
        style={{ width: 92, height: 92 }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">{children}</svg>
        <span
          className={`absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold ${
            good ? 'bg-green-500' : 'bg-red-400'
          }`}
        >
          {good ? '✓' : '✕'}
        </span>
      </div>
      <span className="text-[11px] text-gray-600 mt-1.5 text-center font-medium leading-tight w-24">{label}</span>
    </div>
  )
}

/** Produto estilizado (uma garrafa/objeto genérico) */
function Product({ x = 50, y = 50, s = 1, blur = false }: { x?: number; y?: number; s?: number; blur?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} filter={blur ? 'url(#blurf)' : undefined}>
      <rect x={-14} y={-22} width={28} height={40} rx={6} fill="#0ea5e9" />
      <rect x={-7} y={-30} width={14} height={10} rx={3} fill="#0284c7" />
      <ellipse cx={0} cy={-6} rx={9} ry={12} fill="#7dd3fc" opacity={0.6} />
    </g>
  )
}

export default function PhotoGuide() {
  const { t } = useI18n()
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
      <svg width="0" height="0">
        <defs>
          <filter id="blurf"><feGaussianBlur stdDeviation="2.2" /></filter>
        </defs>
      </svg>

      <h2 className="text-lg font-bold text-gray-900 mb-1">{t('guide.title')}</h2>
      <p className="text-gray-500 text-sm mb-5">
        {t('guide.intro')}
      </p>

      {/* Diagrama de ângulos */}
      <div className="relative bg-gray-50 rounded-xl py-10 mb-6 flex items-center justify-center" style={{ minHeight: 220 }}>
        <div className="absolute w-16 h-16 bg-brand-100 border-2 border-brand-400 rounded-lg flex items-center justify-center text-2xl">
          📦
        </div>
        {ANGLES.map((a, i) => {
          const angle = (i / ANGLES.length) * 2 * Math.PI - Math.PI / 2
          const radius = 95
          const x = Math.cos(angle) * radius
          const y = Math.sin(angle) * radius
          return (
            <div key={a.key} className="absolute flex flex-col items-center" style={{ transform: `translate(${x}px, ${y}px)` }}>
              <div className="w-9 h-9 bg-white border border-gray-300 rounded-full flex items-center justify-center text-base shadow-sm">
                {a.emoji}
              </div>
              <span className="text-[10px] text-gray-600 mt-0.5 font-medium whitespace-nowrap">{t(a.key)}</span>
            </div>
          )
        })}
      </div>

      {/* Exemplos ilustrados: bom vs mau */}
      <p className="text-sm font-semibold text-gray-800 mb-3">{t('guide.examples')}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-5 mb-6">
        {/* Tamanho */}
        <Shot good label={t('guide.egBig')}>
          <rect width={100} height={100} fill="#f1f5f9" />
          <Product x={50} y={52} s={1.4} />
        </Shot>
        <Shot good={false} label={t('guide.egSmall')}>
          <rect width={100} height={100} fill="#f1f5f9" />
          <Product x={30} y={64} s={0.55} />
        </Shot>

        {/* Fundo */}
        <Shot good label={t('guide.egPlain')}>
          <rect width={100} height={100} fill="#f8fafc" />
          <Product x={50} y={54} s={1.2} />
        </Shot>
        <Shot good={false} label={t('guide.egBusy')}>
          <rect width={100} height={100} fill="#e2e8f0" />
          <circle cx={18} cy={20} r={9} fill="#fca5a5" />
          <rect x={70} y={12} width={20} height={16} fill="#fcd34d" />
          <circle cx={82} cy={78} r={11} fill="#86efac" />
          <rect x={8} y={70} width={18} height={18} fill="#c4b5fd" />
          <Product x={50} y={54} s={1.1} />
        </Shot>

        {/* Foco */}
        <Shot good label={t('guide.egSharp')}>
          <rect width={100} height={100} fill="#f1f5f9" />
          <Product x={50} y={52} s={1.3} />
        </Shot>
        <Shot good={false} label={t('guide.egBlur')}>
          <rect width={100} height={100} fill="#f1f5f9" />
          <Product x={50} y={52} s={1.3} blur />
        </Shot>
      </div>

      {/* Boas vs más práticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-green-50 rounded-xl p-4">
          <p className="font-semibold text-green-800 text-sm mb-2">{t('guide.do')}</p>
          <ul className="space-y-1 text-sm text-green-900">
            <li>• {t('guide.do1')}</li>
            <li>• {t('guide.do2')}</li>
            <li>• {t('guide.do3')}</li>
            <li>• {t('guide.do4')}</li>
            <li>• {t('guide.do5')}</li>
          </ul>
        </div>
        <div className="bg-red-50 rounded-xl p-4">
          <p className="font-semibold text-red-800 text-sm mb-2">{t('guide.dont')}</p>
          <ul className="space-y-1 text-sm text-red-900">
            <li>• {t('guide.dont1')}</li>
            <li>• {t('guide.dont2')}</li>
            <li>• {t('guide.dont3')}</li>
            <li>• {t('guide.dont4')}</li>
            <li>• {t('guide.dont5')}</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
