'use client'
import { useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import ModelViewer from '@/components/ModelViewer'
import SplatViewer from '@/components/SplatViewer'
import StatusBadge from '@/components/StatusBadge'
import Logo from '@/components/Logo'
import Watermark from '@/components/Watermark'

/* Cubo do logótipo a rodar durante a espera (WebGL — só no browser) */
const LogoCube3D = dynamic(() => import('@/components/LogoCube3D'), {
  ssr: false,
  loading: () => (
    <div className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
  ),
})

type Model = {
  id: string
  name: string
  status: string
  model_url: string | null
  obj_url: string | null
  splat_url: string | null
  stl_url: string | null
  watermark: boolean
  input_type: string
  frames_count: number
  created_at: string
  is_public: boolean
}

export default function ModelPage({ params }: { params: { id: string } }) {
  const [model, setModel] = useState<Model | null>(null)
  const [toggling, setToggling] = useState(false)
  const supabase = createClientComponentClient()

  const load = useCallback(async () => {
    const { data } = await supabase.from('models').select('*').eq('id', params.id).single()
    setModel(data)
  }, [supabase, params.id])

  useEffect(() => {
    load()
    // Polling: se o modelo ainda está a processar, verifica a cada 30 segundos
    const interval = setInterval(() => {
      if (model?.status === 'done' || model?.status === 'error') return
      load()
    }, 30_000)
    return () => clearInterval(interval)
  }, [load, model?.status])

  if (!model) return <div className="min-h-screen flex items-center justify-center text-gray-500">A carregar...</div>

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-800 px-8 py-4 flex justify-between items-center">
        <Link href="/dashboard" className="text-brand-400 hover:text-brand-300">← Voltar ao dashboard</Link>
        <Logo variant="light" height={30} />
        <StatusBadge status={model.status} />
      </nav>

      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{model.name}</h1>
          {model.status === 'done' && model.model_url && (
            <div className="flex gap-3">
              <a
                href={model.model_url}
                download
                className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-brand-500"
              >
                Download .glb
              </a>
              {model.obj_url && (
                <a
                  href={model.obj_url}
                  download
                  className="border border-gray-600 text-gray-300 px-4 py-2 rounded-lg text-sm hover:border-gray-400"
                >
                  Download .obj
                </a>
              )}
              {model.stl_url && (
                <a
                  href={model.stl_url}
                  download
                  className="border border-gray-600 text-gray-300 px-4 py-2 rounded-lg text-sm hover:border-gray-400"
                >
                  Download .stl (impressão 3D)
                </a>
              )}
            </div>
          )}
        </div>

        {/* Visualizadores 3D */}
        {model.status === 'done' && model.model_url ? (
          model.splat_url ? (
            // Dois visualizadores lado a lado: Realista (splat) + Malha (GLB)
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-300 mb-2">✨ Realista (cores + brilho reais)</p>
                <div className="relative bg-gray-800 rounded-2xl overflow-hidden" style={{ height: '500px' }}>
                  <SplatViewer url={model.splat_url} />
                  {model.watermark && <Watermark />}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-300 mb-2">🔷 Malha (para download / AR)</p>
                <div className="relative bg-gray-800 rounded-2xl overflow-hidden" style={{ height: '500px' }}>
                  <ModelViewer url={model.model_url} />
                  {model.watermark && <Watermark />}
                </div>
              </div>
            </div>
          ) : (
            // Só malha (modelos antigos ou sem splat)
            <div className="relative bg-gray-800 rounded-2xl overflow-hidden" style={{ height: '600px' }}>
              <ModelViewer url={model.model_url} />
              {model.watermark && <Watermark />}
            </div>
          )
        ) : (
          <div className="bg-gray-800 rounded-2xl flex flex-col items-center justify-center" style={{ height: '600px' }}>
            {model.status === 'error' ? (
              <>
                <p className="text-red-400 text-lg font-semibold">Erro no processamento</p>
                <p className="text-gray-400 text-sm mt-2">
                  Verifica se as fotos estão nítidas, bem iluminadas e com fundo simples.
                </p>
                <Link href="/upload" className="mt-4 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm">Tentar novamente</Link>
              </>
            ) : (
              <>
                <LogoCube3D size={110} variant="light" speed={0.9} />
                <p className="text-gray-300 font-semibold mt-4">
                  A gerar modelo 3D...
                </p>
                <p className="text-gray-500 text-sm mt-2">Costuma demorar 2-5 minutos. Esta página atualiza automaticamente.</p>
              </>
            )}
          </div>
        )}

        {/* Toggle público / privado */}
        {model.status === 'done' && (
          <div className="mt-6 bg-gray-800 rounded-xl p-5 flex items-center justify-between">
            <div>
              <p className="font-semibold">Partilhar modelo</p>
              <p className="text-gray-400 text-sm">Torna o modelo público para usar o widget embed na tua loja.</p>
            </div>
            <button
              disabled={toggling}
              onClick={async () => {
                setToggling(true)
                const newVal = !model.is_public
                await supabase.from('models').update({ is_public: newVal }).eq('id', model.id)
                setModel(prev => prev ? { ...prev, is_public: newVal } : prev)
                setToggling(false)
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${model.is_public ? 'bg-brand-600' : 'bg-gray-600'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${model.is_public ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        )}

        {/* Embed widget (e-commerce) */}
        {model.status === 'done' && model.is_public && (
          <div className="mt-8 bg-gray-800 rounded-xl p-6">
            <h2 className="font-semibold mb-3">Incorporar na tua loja</h2>
            <p className="text-gray-400 text-sm mb-3">Cola este código no HTML da página do teu produto:</p>
            <code className="block bg-gray-900 rounded-lg p-4 text-sm text-green-400 break-all">
              {`<iframe src="${typeof window !== 'undefined' ? window.location.origin : ''}/embed/${model.id}" width="100%" height="400" frameborder="0" allow="fullscreen" />`}
            </code>
          </div>
        )}
      </div>
    </div>
  )
}
