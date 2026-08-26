'use client'
import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { apiPost } from '@/lib/api'
import { useI18n } from '@/lib/i18n'

/**
 * Botão que inicia o checkout do Stripe para um plano pago.
 * Plano 'free' → vai para registo. Não autenticado → login.
 */
export default function CheckoutButton({
  plan,
  label,
  highlight,
}: {
  plan: 'free' | 'creator' | 'pro'
  label: string
  highlight: boolean
}) {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const { t, lang } = useI18n()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const cls = highlight
    ? 'bg-brand-600 text-white hover:bg-brand-500'
    : 'border-2 border-brand-600 text-brand-600 hover:bg-brand-50'

  async function go() {
    setError('')
    if (plan === 'free') { router.push('/login'); return }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const res = await apiPost('/create-checkout-session', {
        user_id: user.id, plan, currency: lang === 'en' ? 'usd' : 'eur',
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({ detail: 'Erro' }))
        throw new Error(e.detail || `Erro ${res.status}`)
      }
      const { url } = await res.json()
      window.location.href = url
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('plans.checkoutError'))
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={go}
        disabled={loading}
        className={`block w-full text-center py-3 rounded-xl font-semibold disabled:opacity-50 ${cls}`}
      >
        {loading ? t('plans.checkoutOpening') : label}
      </button>
      {error && <p className="text-red-600 text-xs mt-2 text-center">{error}</p>}
    </div>
  )
}
