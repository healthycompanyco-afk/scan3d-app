import Logo from './Logo'

/** Visual do hero: fotos → modelo 3D */
export default function HeroVisual() {
  return (
    <div className="flex items-center justify-center gap-4 sm:gap-8 select-none">
      {/* Pilha de fotos */}
      <div className="relative" style={{ width: 120, height: 120 }}>
        <div className="absolute inset-0 bg-white border border-gray-200 rounded-xl shadow-md rotate-[-8deg] flex items-center justify-center text-3xl">📷</div>
        <div className="absolute inset-0 bg-white border border-gray-200 rounded-xl shadow-md rotate-[4deg] flex items-center justify-center text-3xl">📸</div>
        <div className="absolute inset-0 bg-white border border-gray-200 rounded-xl shadow-lg flex items-center justify-center text-4xl">🖼️</div>
      </div>

      {/* Seta */}
      <div className="flex flex-col items-center text-brand-600">
        <span className="text-3xl">→</span>
        <span className="text-xs font-semibold text-gray-400 mt-1">IA</span>
      </div>

      {/* Cubo 3D */}
      <div className="bg-gray-900 rounded-2xl p-5 shadow-xl">
        <Logo variant="light" showText={false} height={90} />
      </div>
    </div>
  )
}
