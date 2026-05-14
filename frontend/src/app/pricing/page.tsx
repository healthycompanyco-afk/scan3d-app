import Link from 'next/link'

const plans = [
  {
    name: 'Explorer',
    price: 'Grátis',
    period: '',
    models: '3 modelos/mês',
    expiry: 'Expiram em 30 dias',
    photos: 'Máx. 30 fotos',
    video: 'Vídeo até 60 segundos',
    queue: 'Fila normal',
    downloads: ['.glb'],
    api: false,
    commercial: false,
    cta: 'Começar grátis',
    href: '/login',
    highlight: false,
  },
  {
    name: 'Creator',
    price: '€8',
    period: '/mês',
    models: '25 modelos/mês',
    expiry: 'Expiram em 90 dias',
    photos: 'Máx. 80 fotos',
    video: 'Vídeo até 3 minutos',
    queue: 'Fila prioritária',
    downloads: ['.glb', '.obj'],
    api: false,
    commercial: false,
    cta: 'Subscrever Creator',
    href: '/login',
    highlight: true,
  },
  {
    name: 'Pro',
    price: '€20',
    period: '/mês',
    models: 'Modelos ilimitados',
    expiry: 'Guardados para sempre',
    photos: 'Máx. 150 fotos',
    video: 'Vídeo até 10 minutos',
    queue: 'Fila máxima prioritária',
    downloads: ['.glb', '.obj', '.stl'],
    api: true,
    commercial: true,
    cta: 'Subscrever Pro',
    href: '/login',
    highlight: false,
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-8 py-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-brand-600">Scan3D</Link>
        <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">Entrar</Link>
      </nav>

      <div className="max-w-5xl mx-auto px-8 py-16">
        <h1 className="text-4xl font-bold text-center mb-4">Preços simples</h1>
        <p className="text-gray-500 text-center mb-12">Sem surpresas. Começa grátis, cancela quando quiseres.</p>

        <div className="grid grid-cols-3 gap-6">
          {plans.map(plan => (
            <div
              key={plan.name}
              className={`bg-white rounded-2xl p-8 border-2 ${plan.highlight ? 'border-brand-600 shadow-xl' : 'border-gray-200'}`}
            >
              {plan.highlight && (
                <span className="text-xs bg-brand-600 text-white px-3 py-1 rounded-full">Mais popular</span>
              )}
              <h2 className="text-2xl font-bold mt-3">{plan.name}</h2>
              <div className="my-4">
                <span className="text-4xl font-bold text-brand-600">{plan.price}</span>
                <span className="text-gray-500">{plan.period}</span>
              </div>

              <ul className="space-y-3 text-sm text-gray-600 mb-8">
                {[plan.models, plan.expiry, plan.photos, plan.video, plan.queue].map(item => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> {item}
                  </li>
                ))}
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Download: {plan.downloads.join(', ')}
                </li>
                {plan.api && <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Acesso à API</li>}
                {plan.commercial && <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Uso comercial</li>}
              </ul>

              <Link
                href={plan.href}
                className={`block text-center py-3 rounded-xl font-semibold ${
                  plan.highlight
                    ? 'bg-brand-600 text-white hover:bg-brand-500'
                    : 'border-2 border-brand-600 text-brand-600 hover:bg-brand-50'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-gray-400 text-sm mt-10">
          Pagamentos processados de forma segura por Stripe. Cancela a qualquer momento.
        </p>
      </div>
    </div>
  )
}
