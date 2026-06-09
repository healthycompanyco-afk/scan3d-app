'use client'
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ModelCard from '@/components/ModelCard'
import UsageBar from '@/components/UsageBar'
import Logo from '@/components/Logo'

type Model = {
  id: string
  name: string
  status: string
  input_type: string
  frames_count: number
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
  const supabase = createClientComponentClient()
  const router = useRouter()

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
    }
    load()
  }, [supabase, router])

  async function deleteModel(id: string) {
    await supabase.from('models').delete().eq('id', id)
    setModels(prev => prev.filter(m => m.id !== id))
  }

  async function manageSubscription() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/create-portal-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id }),
    })
    if (res.ok) {
      const { url } = await res.json()
      window.location.href = url
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">A carregar...</div>

  const limit = PLAN_LIMITS[profile?.plan ?? 'free']
  const used = profile?.models_this_month ?? 0

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-8 py-4 flex justify-between items-center">
        <Link href="/"><Logo height={32} /></Link>
        <div className="flex gap-4 items-center">
          <Link href="/pricing" className="text-sm text-gray-600 hover:text-gray-900">Planos</Link>
          <Link href="/upload" className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-brand-500">
            + Novo modelo
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-8 py-10">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Os meus modelos</h1>
            <p className="text-gray-500 text-sm mt-1">
              Plano: <span className="font-semibold capitalize">{profile?.plan ?? 'free'}</span>
              {(profile?.plan ?? 'free') === 'free' ? (
                <Link href="/pricing" className="ml-3 text-brand-600 hover:underline font-medium">Fazer upgrade →</Link>
              ) : (
                <button onClick={manageSubscription} className="ml-3 text-brand-600 hover:underline font-medium">
                  Gerir subscrição
                </button>
              )}
            </p>
          </div>
          <UsageBar used={used} limit={limit} />
        </div>

        {models.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg">Ainda não tens modelos.</p>
            <Link href="/upload" className="text-brand-600 hover:underline mt-2 inline-block">Criar o primeiro modelo →</Link>
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
