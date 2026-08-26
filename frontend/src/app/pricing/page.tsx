'use client'
import Link from 'next/link'
import Logo from '@/components/Logo'
import CheckoutButton from '@/components/CheckoutButton'
import LanguageToggle from '@/components/LanguageToggle'
import { useI18n } from '@/lib/i18n'

type PlanId = 'free' | 'creator' | 'pro'

const PLANS: {
  id: PlanId
  name: string
  price: Record<'eur' | 'usd', string>
  showPeriod: boolean
  features: string[]
  downloads: string[]
  ctaKey: string
  highlight: boolean
}[] = [
  {
    id: 'free',
    name: 'Explorer',
    price: { eur: '', usd: '' },  // o plano grátis mostra t('pricing.free')
    showPeriod: false,
    features: ['plans.f.models3', 'plans.f.exp30', 'plans.f.photos', 'plans.f.quality'],
    downloads: ['.glb'],
    ctaKey: 'plans.cta.free',
    highlight: false,
  },
  {
    id: 'creator',
    name: 'Creator',
    price: { eur: '€8', usd: '$9' },
    showPeriod: true,
    features: ['plans.f.models25', 'plans.f.exp90', 'plans.f.photos', 'plans.f.queue'],
    downloads: ['.glb', '.obj', '.stl'],
    ctaKey: 'plans.cta.creator',
    highlight: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: { eur: '€20', usd: '$22' },
    showPeriod: true,
    features: ['plans.f.unlimited', 'plans.f.expNever', 'plans.f.photos', 'plans.f.queueMax', 'plans.f.commercial'],
    downloads: ['.glb', '.obj', '.stl'],
    ctaKey: 'plans.cta.pro',
    highlight: false,
  },
]

export default function PricingPage() {
  const { t, lang } = useI18n()
  // O idioma escolhe a moeda: inglês paga em dólares, português em euros.
  // Os dois valores estão definidos no mesmo preço do Stripe (currency_options),
  // por isso o webhook continua a reconhecer o plano pelo mesmo price_id.
  const moeda = lang === 'en' ? 'usd' : 'eur'

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-8 py-4 flex justify-between items-center">
        <Link href="/"><Logo height={32} /></Link>
        <div className="flex items-center gap-4">
          <LanguageToggle />
          <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">{t('nav.login')}</Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-8 py-16">
        <h1 className="text-4xl font-bold text-center mb-4">{t('plans.title')}</h1>
        <p className="text-gray-500 text-center mb-12">{t('plans.subtitle')}</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map(plan => (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl p-8 border-2 flex flex-col ${
                plan.highlight ? 'border-brand-600 shadow-xl' : 'border-gray-200'
              }`}
            >
              {plan.highlight && (
                <span className="text-xs bg-brand-600 text-white px-3 py-1 rounded-full self-start">
                  {t('pricing.popular')}
                </span>
              )}
              <h2 className="text-2xl font-bold mt-3">{plan.name}</h2>
              <div className="my-4">
                <span className="text-4xl font-bold text-brand-600">
                  {plan.id === 'free' ? t('pricing.free') : plan.price[moeda]}
                </span>
                {plan.showPeriod && <span className="text-gray-500">{t('plans.month')}</span>}
              </div>

              <ul className="space-y-3 text-sm text-gray-600 mb-8 flex-1">
                {plan.features.map(chave => (
                  <li key={chave} className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> {t(chave)}
                  </li>
                ))}
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  {t('plans.download')} {plan.downloads.join(', ')}
                </li>
                <li className="flex items-center gap-2">
                  <span className={plan.id === 'free' ? 'text-amber-500' : 'text-green-500'}>
                    {plan.id === 'free' ? '◐' : '✓'}
                  </span>
                  {plan.id === 'free' ? t('plans.wmFree') : t('plans.wmPaid')}
                </li>
              </ul>

              <CheckoutButton plan={plan.id} label={t(plan.ctaKey)} highlight={plan.highlight} />
            </div>
          ))}
        </div>

        <p className="text-center text-gray-400 text-sm mt-10">{t('plans.stripeNote')}</p>
        <p className="text-center text-gray-400 text-xs mt-3">
          <Link href="/terms" className="underline hover:text-gray-600">{t('nav.terms')}</Link>
          {' · '}
          <Link href="/privacy" className="underline hover:text-gray-600">{t('nav.privacy')}</Link>
        </p>
      </div>
    </div>
  )
}
