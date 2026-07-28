'use client'
import Link from 'next/link'
import Logo from '@/components/Logo'
import HeroVisual from '@/components/HeroVisual'
import NavAuth from '@/components/NavAuth'
import { useI18n } from '@/lib/i18n'

export default function LandingPage() {
  const { t } = useI18n()

  return (
    <main className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 sm:px-8 py-4 border-b sticky top-0 bg-white/90 backdrop-blur z-50">
        <Logo height={32} />
        <NavAuth />
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 sm:px-8 pt-20 pb-16 text-center">
        <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6 leading-tight pt-6">
          {t('hero.title1')}<br />
          <span className="text-brand-600">{t('hero.title2')}</span>
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          {t('hero.subtitle')}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-4">
          <Link href="/login" className="bg-brand-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-brand-500 w-full sm:w-auto">
            {t('hero.cta')}
          </Link>
          <Link href="/pricing" className="border-2 border-gray-200 text-gray-700 px-8 py-4 rounded-xl text-lg font-semibold hover:border-gray-300 w-full sm:w-auto">
            {t('hero.ctaPricing')}
          </Link>
        </div>
        <p className="text-sm text-gray-400 mb-14">{t('hero.trust')}</p>

        <HeroVisual />
      </section>

      {/* Benefícios */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-5xl mx-auto px-6 sm:px-8">
          <h2 className="text-3xl font-bold text-center mb-3">{t('benefits.title')}</h2>
          <p className="text-gray-500 text-center mb-12">{t('benefits.subtitle')}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: '⚡', title: t('benefits.fast.title'), desc: t('benefits.fast.desc') },
              { icon: '✨', title: t('benefits.real.title'), desc: t('benefits.real.desc') },
              { icon: '📱', title: t('benefits.phone.title'), desc: t('benefits.phone.desc') },
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
          <h2 className="text-3xl font-bold text-center mb-12">{t('how.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '1', title: t('how.s1.title'), desc: t('how.s1.desc') },
              { step: '2', title: t('how.s2.title'), desc: t('how.s2.desc') },
              { step: '3', title: t('how.s3.title'), desc: t('how.s3.desc') },
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
          <h2 className="text-3xl font-bold mb-3">{t('cases.title')}</h2>
          <p className="text-gray-500 mb-12">{t('cases.subtitle')}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: '🛒', label: t('cases.stores') },
              { icon: '🏷️', label: t('cases.markets') },
              { icon: '🖨️', label: t('cases.print') },
              { icon: '📐', label: t('cases.ar') },
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
        <h2 className="text-3xl font-bold mb-3">{t('pricing.title')}</h2>
        <p className="text-gray-600 mb-10">{t('pricing.subtitle')}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: 'Explorer', price: t('pricing.free'), models: t('pricing.modelsFree'), highlight: false },
            { name: 'Creator', price: '€8/mês', models: t('pricing.modelsCreator'), highlight: true },
            { name: 'Pro', price: '€20/mês', models: t('pricing.modelsPro'), highlight: false },
          ].map(({ name, price, models, highlight }) => (
            <div key={name} className={`border-2 rounded-2xl p-7 ${highlight ? 'border-brand-600 shadow-lg' : 'border-gray-200'}`}>
              {highlight && <span className="text-xs bg-brand-600 text-white px-2 py-1 rounded-full">{t('pricing.popular')}</span>}
              <h3 className="text-xl font-bold mt-2">{name}</h3>
              <p className="text-3xl font-bold text-brand-600 my-2">{price}</p>
              <p className="text-gray-600 text-sm">{models}</p>
            </div>
          ))}
        </div>
        <Link href="/pricing" className="text-brand-600 hover:underline mt-8 inline-block font-medium">
          {t('pricing.details')}
        </Link>
      </section>

      {/* FAQ */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-3xl mx-auto px-6 sm:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">{t('faq.title')}</h2>
          <div className="space-y-3">
            {[
              { q: t('faq.q1'), a: t('faq.a1') },
              { q: t('faq.q2'), a: t('faq.a2') },
              { q: t('faq.q3'), a: t('faq.a3') },
              { q: t('faq.q4'), a: t('faq.a4') },
              { q: t('faq.q5'), a: t('faq.a5') },
              { q: t('faq.q6'), a: t('faq.a6') },
            ].map(({ q, a }) => (
              <details key={q} className="bg-white rounded-xl border border-gray-100 p-5 group">
                <summary className="font-semibold text-gray-800 cursor-pointer list-none flex justify-between items-center">
                  {q}
                  <span className="text-brand-600 group-open:rotate-45 transition-transform text-xl">+</span>
                </summary>
                <p className="text-gray-600 text-sm mt-3">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-brand-600 py-16">
        <div className="max-w-3xl mx-auto px-6 sm:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">{t('cta.title')}</h2>
          <p className="text-brand-100 mb-8">{t('cta.subtitle')}</p>
          <Link href="/login" className="bg-white text-brand-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-100 inline-block">
            {t('cta.button')}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
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
