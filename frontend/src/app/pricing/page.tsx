import Link from 'next/link'
import Logo from '@/components/Logo'
import CheckoutButton from '@/components/CheckoutButton'

type PlanId = 'free' | 'creator' | 'pro'

const plans: {
  id: PlanId
  name: string
  price: string
  period: string
  features: string[]
  downloads: string[]
  watermark: string
  cta: string
  highlight: boolean
}[] = [
  {
    id: 'free',
    name: 'Explorer',
    price: 'Grátis',
    period: '',
    features: ['3 modelos/mês', 'Modelos expiram em 30 dias', 'Até 6 fotos por modelo', 'IA fotorrealista (TRELLIS)'],
    downloads: ['.glb'],
    watermark: 'Com marca de água Snap3D',
    cta: 'Começar grátis',
    highlight: false,
  },
  {
    id: 'creator',
    name: 'Creator',
    price: '€8',
    period: '/mês',
    features: ['25 modelos/mês', 'Modelos guardados 90 dias', 'Até 6 fotos por modelo', 'Fila prioritária'],
    downloads: ['.glb', '.obj', '.stl'],
    watermark: 'Sem marca de água',
    cta: 'Subscrever Creator',
    highlight: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '€20',
    period: '/mês',
    features: ['Modelos ilimitados', 'Guardados para sempre', 'Até 6 fotos por modelo', 'Fila máxima prioritária', 'Uso comercial'],
    downloads: ['.glb', '.obj', '.stl'],
    watermark: 'Sem marca de água',
    cta: 'Subscrever Pro',
    highlight: false,
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-8 py-4 flex justify-between items-center">
        <Link href="/"><Logo height={32} /></Link>
        <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">Entrar</Link>
      </nav>

      <div className="max-w-5xl mx-auto px-8 py-16">
        <h1 className="text-4xl font-bold text-center mb-4">Preços simples</h1>
        <p className="text-gray-500 text-center mb-12">Sem surpresas. Começa grátis, cancela quando quiseres.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map(plan => (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl p-8 border-2 flex flex-col ${plan.highlight ? 'border-brand-600 shadow-xl' : 'border-gray-200'}`}
            >
              {plan.highlight && (
                <span className="text-xs bg-brand-600 text-white px-3 py-1 rounded-full self-start">Mais popular</span>
              )}
              <h2 className="text-2xl font-bold mt-3">{plan.name}</h2>
              <div className="my-4">
                <span className="text-4xl font-bold text-brand-600">{plan.price}</span>
                <span className="text-gray-500">{plan.period}</span>
              </div>

              <ul className="space-y-3 text-sm text-gray-600 mb-8 flex-1">
                {plan.features.map(item => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> {item}
                  </li>
                ))}
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Download: {plan.downloads.join(', ')}
                </li>
                <li className="flex items-center gap-2">
                  <span className={plan.id === 'free' ? 'text-amber-500' : 'text-green-500'}>
                    {plan.id === 'free' ? '◐' : '✓'}
                  </span>
                  {plan.watermark}
                </li>
              </ul>

              <CheckoutButton plan={plan.id} label={plan.cta} highlight={plan.highlight} />
            </div>
          ))}
        </div>

        <p className="text-center text-gray-400 text-sm mt-10">
          Pagamentos processados de forma segura por Stripe. Cancela a qualquer momento.
        </p>
        <p className="text-center text-gray-400 text-xs mt-3">
          <Link href="/terms" className="underline hover:text-gray-600">Termos</Link>
          {' · '}
          <Link href="/privacy" className="underline hover:text-gray-600">Privacidade</Link>
        </p>
      </div>
    </div>
  )
}
