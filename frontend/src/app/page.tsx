import Link from 'next/link'
import Logo from '@/components/Logo'
import HeroVisual from '@/components/HeroVisual'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 sm:px-8 py-4 border-b sticky top-0 bg-white/90 backdrop-blur z-50">
        <Logo height={32} />
        <div className="flex gap-3 sm:gap-4 items-center">
          <Link href="/pricing" className="text-gray-600 hover:text-gray-900 text-sm">Preços</Link>
          <Link href="/login" className="text-gray-600 hover:text-gray-900 text-sm">Entrar</Link>
          <Link href="/login" className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-500 text-sm font-medium">
            Começar grátis
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 sm:px-8 pt-20 pb-16 text-center">
        <span className="inline-block bg-brand-50 text-brand-700 text-xs font-semibold px-3 py-1 rounded-full mb-6">
          ✨ Powered by IA generativa (TRELLIS)
        </span>
        <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6 leading-tight">
          Transforma fotos em<br />
          <span className="text-brand-600">modelos 3D fotorrealistas</span>
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          Tira 4 a 6 fotos do teu produto. Em minutos tens um modelo 3D interativo,
          pronto para a tua loja online — sem scanner, sem software, sem complicações.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-4">
          <Link href="/login" className="bg-brand-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-brand-500 w-full sm:w-auto">
            Criar o meu primeiro modelo →
          </Link>
          <Link href="/pricing" className="border-2 border-gray-200 text-gray-700 px-8 py-4 rounded-xl text-lg font-semibold hover:border-gray-300 w-full sm:w-auto">
            Ver preços
          </Link>
        </div>
        <p className="text-sm text-gray-400 mb-14">3 modelos grátis por mês · Sem cartão de crédito</p>

        <HeroVisual />
      </section>

      {/* Benefícios */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-5xl mx-auto px-6 sm:px-8">
          <h2 className="text-3xl font-bold text-center mb-3">Porquê Snap3D?</h2>
          <p className="text-gray-500 text-center mb-12">Tudo o que precisas, nada do que não precisas.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: '⚡', title: 'Rápido', desc: 'Do upload ao modelo 3D em poucos minutos. Sem esperas longas nem processos complicados.' },
              { icon: '✨', title: 'Fotorrealista', desc: 'IA de última geração que captura cores e brilho reais — qualidade de e-commerce.' },
              { icon: '📱', title: 'Só precisas do telemóvel', desc: 'Sem scanners caros nem software técnico. Bastam fotos normais do produto.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-7 border border-gray-100">
                <div className="text-3xl mb-3">{icon}</div>
                <h3 className="font-semibold text-lg mb-2">{title}</h3>
                <p className="text-gray-600 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6 sm:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Como funciona</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Tira as fotos', desc: 'Fotografa o produto de 4 a 6 ângulos diferentes. Temos um guia visual para te ajudar a tirar fotos perfeitas.' },
              { step: '2', title: 'A IA gera o 3D', desc: 'A nossa IA combina as fotos e reconstrói o produto em 3D, com texturas e cores reais.' },
              { step: '3', title: 'Usa em qualquer lado', desc: 'Vê no browser, descarrega (.glb, .obj, .stl para impressão 3D) ou incorpora na tua loja com um widget.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-12 h-12 bg-brand-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {step}
                </div>
                <h3 className="font-semibold text-lg mb-2">{title}</h3>
                <p className="text-gray-600 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Casos de uso */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 text-center">
          <h2 className="text-3xl font-bold mb-3">Perfeito para</h2>
          <p className="text-gray-500 mb-12">Onde os modelos 3D fazem a diferença.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: '🛒', label: 'Lojas online' },
              { icon: '🏷️', label: 'Marketplaces' },
              { icon: '🖨️', label: 'Impressão 3D' },
              { icon: '📐', label: 'Catálogos / AR' },
            ].map(({ icon, label }) => (
              <div key={label} className="bg-white rounded-xl p-6 border border-gray-100">
                <div className="text-3xl mb-2">{icon}</div>
                <p className="font-medium text-gray-700 text-sm">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="py-20 max-w-5xl mx-auto px-6 sm:px-8 text-center">
        <h2 className="text-3xl font-bold mb-3">Preços simples e transparentes</h2>
        <p className="text-gray-600 mb-10">Começa grátis, escala quando precisares.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: 'Explorer', price: 'Grátis', models: '3 modelos/mês', highlight: false },
            { name: 'Creator', price: '€8/mês', models: '25 modelos/mês', highlight: true },
            { name: 'Pro', price: '€20/mês', models: 'Modelos ilimitados', highlight: false },
          ].map(({ name, price, models, highlight }) => (
            <div key={name} className={`border-2 rounded-2xl p-7 ${highlight ? 'border-brand-600 shadow-lg' : 'border-gray-200'}`}>
              {highlight && <span className="text-xs bg-brand-600 text-white px-2 py-1 rounded-full">Mais popular</span>}
              <h3 className="text-xl font-bold mt-2">{name}</h3>
              <p className="text-3xl font-bold text-brand-600 my-2">{price}</p>
              <p className="text-gray-600 text-sm">{models}</p>
            </div>
          ))}
        </div>
        <Link href="/pricing" className="text-brand-600 hover:underline mt-8 inline-block font-medium">
          Ver todos os detalhes →
        </Link>
      </section>

      {/* CTA final */}
      <section className="bg-brand-600 py-16">
        <div className="max-w-3xl mx-auto px-6 sm:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Pronto para dar vida aos teus produtos?</h2>
          <p className="text-brand-100 mb-8">Cria o teu primeiro modelo 3D grátis hoje. Não precisas de cartão.</p>
          <Link href="/login" className="bg-white text-brand-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-100 inline-block">
            Começar grátis →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo height={28} />
          <div className="flex gap-6 text-sm text-gray-500">
            <Link href="/pricing" className="hover:text-gray-900">Preços</Link>
            <Link href="/login" className="hover:text-gray-900">Entrar</Link>
          </div>
          <p className="text-xs text-gray-400">© {new Date().getFullYear()} Snap3D</p>
        </div>
      </footer>
    </main>
  )
}
