'use client'
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ModelCard from '@/components/ModelCard'
import UsageBar from '@/components/UsageBar'
import Logo from '@/components/Logo'
import { apiPost } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import LanguageToggle from '@/components/LanguageToggle'

type Model = {
  id: string
  name: string
  status: string
  input_type: string
  frames_count: number
  thumbnail_url: string | null
  model_url: string | null
  created_at: string
  expires_at: string
}

type Profile = {
  plan: string
  models_this_month: number
}

const PLAN_LIMITS: Record<string, number> = { free: 3, creator: 25, pro: Infinity }

export default function DashboardPage() {
  const [models, setModels] = useState<Model[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [justUpgraded, setJustUpgraded] = useState(false)
  const supabase = createClientComponentClient()
  const router = useRouter()
  const { t } = useI18n()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const nowIso = new Date().toISOString()
      const [{ data: profileData }, { data: modelsData }] = await Promise.all([
        supabase.from('user_profiles').select('plan, models_this_month').eq('id', user.id).single(),
        supabase.from('models').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ])

      setProfile(profileData)
      // Esconde modelos já expirados (expires_at no passado)
      setModels((modelsData ?? []).filter(m => !m.expires_at || m.expires_at > nowIso))
      setLoading(false)

      // Email de boas-vindas (o backend garante que só envia uma vez)
      apiPost('/welcome').catch(() => {})

      // Regresso do checkout Stripe: confirmar e reler o plano, porque o
      // webhook pode demorar alguns segundos a chegar.
      if (new URLSearchParams(window.location.search).has('upgraded')) {
        setJustUpgraded(true)
        window.history.replaceState({}, '', '/dashboard')
        setTimeout(async () => {
          const { data } = await supabase
            .from('user_profiles').select('plan, models_this_month').eq('id', user.id).single()
          if (data) setProfile(data)
        }, 4000)
      }
    }
    load()
  }, [supabase, router])

  async function deleteModel(id: string) {
    await supabase.from('models').delete().eq('id', id)
    setModels(prev => prev.filter(m => m.id !== id))
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  async function manageSubscription() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const res = await apiPost('/create-portal-session', { user_id: user.id })
    if (res.ok) {
      const { url } = await res.json()
      window.location.href = url
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">{t('dash.loading')}</div>

  const limit = PLAN_LIMITS[profile?.plan ?? 'free']
  const used = profile?.models_this_month ?? 0

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-8 py-4 flex justify-between items-center">
        <Link href="/"><Logo height={32} /></Link>
        <div className="flex gap-4 items-center">
          <LanguageToggle />
          <Link href="/pricing" className="text-sm text-gray-600 hover:text-gray-900">{t('dash.plans')}</Link>
          <button onClick={logout} className="text-sm text-gray-600 hover:text-gray-900">{t('dash.logout')}</button>
          <Link href="/upload" className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-brand-500">
            {t('dash.newModel')}
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-8 py-10">
        {justUpgraded && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-5 py-4 flex items-start gap-3">
            <span className="text-green-600 text-lg leading-none">✓</span>
            <div>
              <p className="font-semibold text-green-900">{t('dash.paidTitle')}</p>
              <p className="text-green-800 text-sm mt-0.5">
                {t('dash.paidBody')}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">{t('dash.title')}</h1>
            <p className="text-gray-500 text-sm mt-1">
              {t('dash.plan')} <span className="font-semibold capitalize">{profile?.plan ?? 'free'}</span>
              {(profile?.plan ?? 'free') === 'free' ? (
                <Link href="/pricing" className="ml-3 text-brand-600 hover:underline font-medium">{t('dash.upgrade')}</Link>
              ) : (
                <button onClick={manageSubscription} className="ml-3 text-brand-600 hover:underline font-medium">
                  {t('dash.manageSub')}
                </button>
              )}
            </p>
          </div>
          <UsageBar used={used} limit={limit} />
        </div>

        {models.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg">{t('dash.empty')}</p>
            <Link href="/upload" className="text-brand-600 hover:underline mt-2 inline-block">{t('dash.createFirst')}</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {models.map(model => (
              <ModelCard key={model.id} model={model} onDelete={deleteModel} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
