/**
 * Logo Snap3D — cubo isométrico (3D) com abertura de lente (snap).
 * Adapta-se a fundos claros (variant="dark") e escuros (variant="light").
 */
export default function Logo({
  variant = 'dark',
  showText = true,
  height = 32,
}: {
  variant?: 'dark' | 'light'
  showText?: boolean
  height?: number
}) {
  const light = variant === 'light'
  const edge = light ? '#ffffff' : '#0a0a0a'
  const topFace = light ? '#ffffff' : '#ffffff'
  const leftFace = light ? '#9ca3af' : '#6b7280'
  const rightFace = light ? '#4b5563' : '#0a0a0a'
  const textMain = light ? '#ffffff' : '#0a0a0a'
  const textAccent = light ? '#9ca3af' : '#8a8a8a'
  const width = showText ? height * (240 / 64) : height

  return (
    <svg
      width={width}
      height={height}
      viewBox={showText ? '0 0 240 64' : '0 0 64 64'}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Snap3D"
    >
      <g>
        <path d="M32 33 L54 21 L54 43 L32 55 Z" fill={rightFace} />
        <path d="M32 33 L10 21 L10 43 L32 55 Z" fill={leftFace} />
        <path d="M32 11 L54 21 L32 33 L10 21 Z" fill={topFace} stroke={edge} strokeWidth={1.5} strokeLinejoin="round" />
        <path d="M32 33 L54 21 L54 43 L32 55 L10 43 L10 21 Z" stroke={edge} strokeWidth={1.5} strokeLinejoin="round" fill="none" />
        <path d="M32 33 L32 55" stroke={edge} strokeWidth={1.5} />
        <ellipse cx={32} cy={21} rx={6.5} ry={3.6} fill="none" stroke={edge} strokeWidth={1.4} />
        <circle cx={32} cy={21} r={1.4} fill={edge} />
      </g>
      {showText && (
        <text
          x={74}
          y={42}
          fontFamily="'Helvetica Neue', Arial, sans-serif"
          fontSize={30}
          fontWeight={700}
          letterSpacing={-0.5}
          fill={textMain}
        >
          Snap
          <tspan fill={textAccent}>3D</tspan>
        </text>
      )}
    </svg>
  )
}
