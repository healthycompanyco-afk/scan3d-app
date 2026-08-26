'use client'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import Logo from '@/components/Logo'
import HeroVisual from '@/components/HeroVisual'
import NavAuth from '@/components/NavAuth'
import ExamplesGallery from '@/components/ExamplesGallery'
import { useI18n } from '@/lib/i18n'
import {
  IconBolt, IconSparkle, IconPhone, IconCart, IconTag,
  IconPrinter, IconCube, IconCamera, IconDownload, IconCheck,
} from '@/components/Icons'

/* Cubo do logótipo em 3D — só carrega depois do primeiro paint */
const LogoCube3D = dynamic(() => import('@/components/LogoCube3D'), {
  ssr: false,
  loading: () => <div style={{ width: 76, height: 76 }} />,
})

export default function LandingPage() {
  const { t } = useI18n()

  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 sm:px-8 py-4 border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <Logo height={32} />
        <NavAuth />
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* brilho de fundo */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-40 h-[520px] opacity-70"
          style={{
            background:
              'radial-gradient(60% 60% at 50% 40%, #e0f2fe 0%, rgba(224,242,254,0) 70%)',
          }}
        />
        <div className="relative max-w-5xl mx-auto px-6 sm:px-8 pt-12 pb-14 text-center">
          <div className="flex justify-center mb-4 animate-fade-up">
            <LogoCube3D size={76} />
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold mb-6 leading-[1.08] tracking-tight animate-fade-up">
            {t('hero.title1')}<br />
            <span className="text-gradient">{t('hero.title2')}</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-9 max-w-2xl mx-auto animate-fade-up delay-100">
            {t('hero.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-4 animate-fade-up delay-200">
            <Link
              href="/login"
              className="bg-brand-600 text-white px-8 py-4 rounded-xl text-lg font-semibold w-full sm:w-auto
                         shadow-lg shadow-brand-600/25 hover:bg-brand-500 hover:-translate-y-0.5 transition-all"
            >
              {t('hero.cta')}
            </Link>
            <Link
              href="/pricing"
              className="border-2 border-gray-200 text-gray-700 px-8 py-4 rounded-xl text-lg font-semibold
                         w-full sm:w-auto hover:border-gray-300 hover:bg-gray-50 transition-colors"
            >
              {t('hero.ctaPricing')}
            </Link>
          </div>
          <p className="text-sm text-gray-400 mb-16 animate-fade-up delay-300">{t('hero.trust')}</p>

          <div className="animate-fade-up delay-300">
            <HeroVisual />
          </div>
        </div>
      </section>

      {/* Barra de números */}
      <section className="border-y border-gray-100 bg-gray-50/60">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { n: '2-5', l: t('trust.time') },
            { n: '4-6', l: t('trust.photos') },
            { n: '3', l: t('trust.formats') },
            { n: '3', l: t('trust.free') },
          ].map(({ n, l }) => (
            <div key={l}>
              <p className="text-3xl font-bold text-brand-600">{n}</p>
              <p className="text-xs text-gray-500 mt-1">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Exemplos reais (só aparece se houver modelos públicos) */}
      <ExamplesGallery />

      {/* Benefícios */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6 sm:px-8">
          <h2 className="text-3xl font-bold text-center mb-3 tracking-tight">{t('benefits.title')}</h2>
          <p className="text-gray-500 text-center mb-12">{t('benefits.subtitle')}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { Icon: IconBolt, title: t('benefits.fast.title'), desc: t('benefits.fast.desc') },
              { Icon: IconSparkle, title: t('benefits.real.title'), desc: t('benefits.real.desc') },
              { Icon: IconPhone, title: t('benefits.phone.title'), desc: t('benefits.phone.desc') },
            ].map(({ Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl p-7 border border-gray-100 bg-white hover:border-brand-200
                           hover:shadow-lg hover:shadow-brand-600/5 transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
                  <Icon />
                </div>
                <h3 className="font-semibold text-lg mb-2">{title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-5xl mx-auto px-6 sm:px-8">
          <h2 className="text-3xl font-bold text-center mb-14 tracking-tight">{t('how.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative">
            {/* linha de ligação */}
            <div aria-hidden className="hidden md:block absolute top-7 left-[16%] right-[16%] h-px bg-gradient-to-r from-brand-200 via-brand-300 to-brand-200" />
            {[
              { n: '1', Icon: IconCamera, title: t('how.s1.title'), desc: t('how.s1.desc') },
              { n: '2', Icon: IconCube, title: t('how.s2.title'), desc: t('how.s2.desc') },
              { n: '3', Icon: IconDownload, title: t('how.s3.title'), desc: t('how.s3.desc') },
            ].map(({ n, Icon, title, desc }) => (
              <div key={n} className="text-center relative">
                <div className="w-14 h-14 rounded-2xl bg-white border-2 border-brand-200 text-brand-600
                                flex items-center justify-center mx-auto mb-4 relative z-10 shadow-sm">
                  <Icon className="w-6 h-6" />
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-brand-600 text-white
                                   text-xs font-bold flex items-center justify-center">{n}</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">{title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed max-w-xs mx-auto">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Casos de uso */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 text-center">
          <h2 className="text-3xl font-bold mb-3 tracking-tight">{t('cases.title')}</h2>
          <p className="text-gray-500 mb-12">{t('cases.subtitle')}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { Icon: IconCart, label: t('cases.stores') },
              { Icon: IconTag, label: t('cases.markets') },
              { Icon: IconPrinter, label: t('cases.print') },
              { Icon: IconCube, label: t('cases.ar') },
            ].map(({ Icon, label }) => (
              <div
                key={label}
                className="rounded-xl p-6 border border-gray-100 bg-white hover:border-brand-200
                           hover:-translate-y-0.5 transition-all"
              >
                <div className="text-brand-600 flex justify-center mb-3"><Icon className="w-7 h-7" /></div>
                <p className="font-medium text-gray-700 text-sm">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Preços */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 text-center">
          <h2 className="text-3xl font-bold mb-3 tracking-tight">{t('pricing.title')}</h2>
          <p className="text-gray-600 mb-12">{t('pricing.subtitle')}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {[
              { name: 'Explorer', price: t('pricing.free'), period: '', models: t('pricing.modelsFree'), highlight: false },
              { name: 'Creator', price: '€8', period: t('plans.month'), models: t('pricing.modelsCreator'), highlight: true },
              { name: 'Pro', price: '€20', period: t('plans.month'), models: t('pricing.modelsPro'), highlight: false },
            ].map(({ name, price, period, models, highlight }) => (
              <div
                key={name}
                className={`rounded-2xl p-7 bg-white text-left transition-all ${
                  highlight
                    ? 'border-2 border-brand-600 shadow-xl shadow-brand-600/10 md:-translate-y-2'
                    : 'border border-gray-200 hover:border-gray-300'
                }`}
              >
                {highlight && (
                  <span className="text-xs bg-brand-600 text-white px-2.5 py-1 rounded-full font-medium">
                    {t('pricing.popular')}
                  </span>
                )}
                <h3 className={`text-xl font-bold ${highlight ? 'mt-3' : ''}`}>{name}</h3>
                <p className="my-3">
                  <span className="text-4xl font-bold text-brand-600">{price}</span>
                  <span className="text-gray-500 text-sm">{period}</span>
                </p>
                <p className="text-gray-600 text-sm flex items-center gap-2">
                  <span className="text-brand-600"><IconCheck /></span> {models}
                </p>
              </div>
            ))}
          </div>
          <Link href="/pricing" className="text-brand-600 hover:underline mt-10 inline-block font-medium">
            {t('pricing.details')}
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-6 sm:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 tracking-tight">{t('faq.title')}</h2>
          <div className="space-y-3">
            {[
              { q: t('faq.q1'), a: t('faq.a1') },
              { q: t('faq.q2'), a: t('faq.a2') },
              { q: t('faq.q3'), a: t('faq.a3') },
              { q: t('faq.q4'), a: t('faq.a4') },
              { q: t('faq.q5'), a: t('faq.a5') },
              { q: t('faq.q6'), a: t('faq.a6') },
            ].map(({ q, a }) => (
              <details
                key={q}
                className="rounded-xl border border-gray-200 p-5 group open:border-brand-200 open:bg-brand-50/30 transition-colors"
              >
                <summary className="font-semibold text-gray-800 cursor-pointer list-none flex justify-between items-center gap-4">
                  {q}
                  <span className="text-brand-600 group-open:rotate-45 transition-transform text-xl shrink-0">+</span>
                </summary>
                <p className="text-gray-600 text-sm mt-3 leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-16">
        <div
          className="max-w-5xl mx-auto px-6 sm:px-8 py-14 rounded-3xl text-center mx-6 sm:mx-auto"
          style={{ background: 'linear-gradient(120deg, #0369a1 0%, #0284c7 55%, #0ea5e9 100%)' }}
        >
          <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">{t('cta.title')}</h2>
          <p className="text-brand-100 mb-8">{t('cta.subtitle')}</p>
          <Link
            href="/login"
            className="bg-white text-brand-700 px-8 py-4 rounded-xl text-lg font-semibold
                       hover:-translate-y-0.5 transition-transform inline-block shadow-lg"
          >
            {t('cta.button')}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-10">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-5">
          <Logo height={28} />
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-500">
            <Link href="/pricing" className="hover:text-gray-900">{t('nav.pricing')}</Link>
            <Link href="/login" className="hover:text-gray-900">{t('nav.login')}</Link>
            <Link href="/terms" className="hover:text-gray-900">{t('nav.terms')}</Link>
            <Link href="/privacy" className="hover:text-gray-900">{t('nav.privacy')}</Link>
          </div>
          <p className="text-xs text-gray-400">© {new Date().getFullYear()} Snap3D</p>
        </div>
      </footer>
    </main>
  )
}
