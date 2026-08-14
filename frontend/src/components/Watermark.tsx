import Logo from './Logo'

/**
 * Marca de água Snap3D — sobreposta nos visualizadores 3D do plano grátis.
 * Não bloqueia a interação (pointer-events-none).
 */
export default function Watermark() {
  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      {/* Badge no canto inferior direito */}
      <div className="absolute bottom-3 right-3 bg-black/45 backdrop-blur-sm rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
        <Logo variant="light" showText={false} height={18} />
        <span className="text-white/90 text-xs font-medium">criado com Snap3D</span>
      </div>
      {/* Marca ao centro (mais difícil de recortar) */}
      <div className="absolute inset-0 flex items-center justify-center opacity-20">
        <Logo variant="light" height={48} />
      </div>
    </div>
  )
}
