import Link from 'next/link'
import Logo from '@/components/Logo'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 border-b">
        <Logo height={32} />
        <div className="flex gap-4">
          <Link href="/pricing" className="text-gray-600 hover:text-gray-900">Preços</Link>
          <Link href="/login" className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-500">
            Entrar
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-8 py-24 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Modelos 3D para a tua loja online,<br />
          <span className="text-brand-600">em minutos</span>
        </h1>
        <p className="text-xl text-gray-600 mb-10">
          Filma o teu produto 30 segundos ou carrega fotos de vários ângulos.
          A nossa IA cria um modelo 3D interativo pronto para o teu e-commerce.
        </p>
        <Link href="/login" className="bg-brand-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-brand-500 inline-block">
          Começar grátis →
        </Link>
        <p className="text-sm text-gray-400 mt-4">3 modelos grátis por mês. Sem cartão de crédito.</p>
      </section>

      {/* Como funciona */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-4xl mx-auto px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Como funciona</h2>
          <div className="grid grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Filma ou fotografa', desc: 'Filma 30-60 segundos à volta do produto, ou carrega 30+ fotos de vários ângulos.' },
              { step: '2', title: 'Processamos automaticamente', desc: 'A nossa IA analisa as imagens e reconstrói a geometria 3D do produto.' },
              { step: '3', title: 'Usa na tua loja', desc: 'Copia o widget embed para o teu site Shopify, WooCommerce ou qualquer plataforma.' },
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

      {/* Pricing preview */}
      <section className="py-20 max-w-4xl mx-auto px-8 text-center">
        <h2 className="text-3xl font-bold mb-4">Preços simples e transparentes</h2>
        <p className="text-gray-600 mb-8">Começa grátis, escala quando precisares.</p>
        <div className="grid grid-cols-3 gap-6">
          {[
            { name: 'Explorer', price: 'Grátis', models: '3 modelos/mês', highlight: false },
            { name: 'Creator', price: '€8/mês', models: '25 modelos/mês', highlight: true },
            { name: 'Pro', price: '€20/mês', models: 'Ilimitado', highlight: false },
          ].map(({ name, price, models, highlight }) => (
            <div key={name} className={`border rounded-xl p-6 ${highlight ? 'border-brand-600 shadow-lg' : 'border-gray-200'}`}>
              {highlight && <span className="text-xs bg-brand-600 text-white px-2 py-1 rounded-full">Mais popular</span>}
              <h3 className="text-xl font-bold mt-2">{name}</h3>
              <p className="text-3xl font-bold text-brand-600 my-2">{price}</p>
              <p className="text-gray-600 text-sm">{models}</p>
            </div>
          ))}
        </div>
        <Link href="/pricing" className="text-brand-600 hover:underline mt-6 inline-block">
          Ver todos os detalhes →
        </Link>
      </section>
    </main>
  )
}
