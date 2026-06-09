'use client'

/**
 * Guia visual de como fotografar o produto para obter o melhor modelo 3D.
 * Mostra os ângulos a capturar + boas/más práticas.
 */
const ANGLES = [
  { emoji: '📸', label: 'Frente', desc: 'Vista principal' },
  { emoji: '↩️', label: 'Lado esquerdo', desc: '45° à esquerda' },
  { emoji: '↪️', label: 'Lado direito', desc: '45° à direita' },
  { emoji: '🔄', label: 'Trás', desc: 'Parte de trás' },
  { emoji: '⬆️', label: 'De cima', desc: 'Ligeiramente acima' },
  { emoji: '⬇️', label: 'De baixo', desc: 'Ligeiramente abaixo' },
]

export default function PhotoGuide() {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
      <h2 className="text-lg font-bold text-gray-900 mb-1">📷 Como tirar as fotos perfeitas</h2>
      <p className="text-gray-500 text-sm mb-5">
        Tira <strong>4 a 6 fotos</strong> do mesmo produto, dando a volta. Quanto melhores as fotos,
        melhor o modelo 3D.
      </p>

      {/* Diagrama de ângulos */}
      <div className="relative bg-gray-50 rounded-xl py-8 mb-6 flex items-center justify-center">
        {/* Objeto central */}
        <div className="absolute w-16 h-16 bg-brand-100 border-2 border-brand-400 rounded-lg flex items-center justify-center text-2xl">
          📦
        </div>
        {/* Câmaras à volta (círculo) */}
        {ANGLES.map((a, i) => {
          const angle = (i / ANGLES.length) * 2 * Math.PI - Math.PI / 2
          const radius = 110
          const x = Math.cos(angle) * radius
          const y = Math.sin(angle) * radius
          return (
            <div
              key={a.label}
              className="absolute flex flex-col items-center"
              style={{ transform: `translate(${x}px, ${y}px)` }}
            >
              <div className="w-10 h-10 bg-white border border-gray-300 rounded-full flex items-center justify-center text-lg shadow-sm">
                {a.emoji}
              </div>
              <span className="text-[11px] text-gray-600 mt-1 font-medium whitespace-nowrap">{a.label}</span>
            </div>
          )
        })}
      </div>

      {/* Lista de ângulos */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
        {ANGLES.map((a, i) => (
          <div key={a.label} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
            <span className="text-brand-600 font-bold text-sm">{i + 1}.</span>
            <div>
              <p className="text-sm font-semibold text-gray-800">{a.label}</p>
              <p className="text-xs text-gray-500">{a.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Boas vs más práticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-green-50 rounded-xl p-4">
          <p className="font-semibold text-green-800 text-sm mb-2">✅ Faz</p>
          <ul className="space-y-1 text-sm text-green-900">
            <li>• Fundo simples e liso (parede branca)</li>
            <li>• Luz forte e difusa (sem sombras duras)</li>
            <li>• Produto a ocupar &gt;70% da foto</li>
            <li>• Fotos nítidas e focadas</li>
            <li>• Mesma distância em todas as fotos</li>
          </ul>
        </div>
        <div className="bg-red-50 rounded-xl p-4">
          <p className="font-semibold text-red-800 text-sm mb-2">❌ Evita</p>
          <ul className="space-y-1 text-sm text-red-900">
            <li>• Fotos tremidas ou desfocadas</li>
            <li>• Objetos transparentes ou de vidro</li>
            <li>• Superfícies muito brilhantes/espelhadas</li>
            <li>• Fundos confusos ou com muitos objetos</li>
            <li>• Sombras fortes ou contraluz</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
