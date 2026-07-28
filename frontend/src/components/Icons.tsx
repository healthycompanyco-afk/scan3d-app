/** Conjunto de ícones SVG (traço) usados na landing. */
type P = { className?: string }
const base = 'w-6 h-6'
const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export const IconBolt = ({ className = base }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...stroke}>
    <path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5Z" />
  </svg>
)

export const IconSparkle = ({ className = base }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...stroke}>
    <path d="M12 3.5 13.9 9l5.6 1.9-5.6 1.9L12 18.4l-1.9-5.6L4.5 11 10.1 9 12 3.5Z" />
    <path d="M18.5 3v3M20 4.5h-3M6 17.5v2.5M7.2 18.8H4.8" />
  </svg>
)

export const IconPhone = ({ className = base }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...stroke}>
    <rect x="6" y="2.5" width="12" height="19" rx="2.6" />
    <path d="M10.5 5.5h3M11 18.6h2" />
  </svg>
)

export const IconCart = ({ className = base }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...stroke}>
    <path d="M2.5 3h2.2l2.1 11.2h10.4l1.9-8.2H6.2" />
    <circle cx="9" cy="19" r="1.6" />
    <circle cx="17" cy="19" r="1.6" />
  </svg>
)

export const IconTag = ({ className = base }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...stroke}>
    <path d="M3.5 11.4V4.5a1 1 0 0 1 1-1h6.9a1 1 0 0 1 .7.3l8.1 8.1a1 1 0 0 1 0 1.4l-6.9 6.9a1 1 0 0 1-1.4 0L3.8 12.1a1 1 0 0 1-.3-.7Z" />
    <circle cx="8" cy="8" r="1.4" />
  </svg>
)

export const IconPrinter = ({ className = base }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...stroke}>
    <path d="M7 9V3.5h10V9" />
    <rect x="3.5" y="9" width="17" height="7.5" rx="2" />
    <path d="M7 14h10v6.5H7z" />
  </svg>
)

export const IconCube = ({ className = base }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...stroke}>
    <path d="M12 2.8 20.5 7v10L12 21.2 3.5 17V7L12 2.8Z" />
    <path d="M3.5 7 12 11.5 20.5 7M12 11.5v9.7" />
  </svg>
)

export const IconCamera = ({ className = base }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...stroke}>
    <path d="M3.5 8.5h3.2l1.5-2.4h7.6l1.5 2.4h3.2v10H3.5v-10Z" />
    <circle cx="12" cy="13" r="3.4" />
  </svg>
)

export const IconDownload = ({ className = base }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...stroke}>
    <path d="M12 3.5v11M7.5 10.5 12 15l4.5-4.5M4 18.5h16" />
  </svg>
)

export const IconCheck = ({ className = 'w-4 h-4' }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...stroke} strokeWidth={2.4}>
    <path d="m4.5 12.5 5 5 10-11" />
  </svg>
)
