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
  const [editingName, setEditingName] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [copied, setCopied] = useState(false)
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

  async function saveName() {
    if (!model) return
    const novo = draftName.trim()
    if (!novo || novo === model.name) { setEditingName(false); return }
    setSavingName(true)
    const { error } = await supabase.from('models').update({ name: novo }).eq('id', model.id)
    if (!error) setModel(prev => (prev ? { ...prev, name: novo } : prev))
    setSavingName(false)
    setEditingName(false)
  }

  if (!model) return <div className="min-h-screen flex items-center justify-center text-gray-500">A carregar...</div>

  const origem = typeof window !== 'undefined' ? window.location.origin : 'https://snap3d.app'
  const embedCode = `<iframe src="${origem}/embed/${model.id}" width="100%" height="480" style="border:0" allow="fullscreen"></iframe>`

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-800 px-8 py-4 flex justify-between items-center">
        <Link href="/dashboard" className="text-brand-400 hover:text-brand-300">← Voltar ao dashboard</Link>
        <Logo variant="light" height={30} />
        <StatusBadge status={model.status} />
      </nav>

      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          {editingName ? (
            <input
              autoFocus
              value={draftName}
              disabled={savingName}
              onChange={e => setDraftName(e.target.value)}
              onBlur={saveName}
              onKeyDown={e => {
                if (e.key === 'Enter') saveName()
                if (e.key === 'Escape') setEditingName(false)
              }}
              maxLength={60}
              className="text-2xl font-bold bg-gray-800 border border-gray-600 rounded-lg px-3 py-1
                         focus:outline-none focus:border-brand-500 disabled:opacity-50"
            />
          ) : (
            <h1 className="text-2xl font-bold flex items-center gap-2 group">
              {model.name}
              <button
                onClick={() => { setDraftName(model.name); setEditingName(true) }}
                title="Mudar o nome"
                aria-label="Mudar o nome"
                className="text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity text-base"
              >
                ✎
              </button>
            </h1>
          )}
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

        {/* Usar na loja: partilha + código de incorporação */}
        {model.status === 'done' && (
          <div className="mt-8 bg-gray-800 rounded-2xl p-6">
            <h2 className="font-semibold text-lg">🛒 Usar na tua loja</h2>
            <p className="text-gray-400 text-sm mt-1 mb-5">
              Mostra este produto a rodar em 3D na tua loja online. Funciona em Shopify,
              WooCommerce, Wix ou qualquer site onde possas colar HTML.
            </p>

            {/* Passo 1 — tornar público */}
            <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-4">
              <div>
                <p className="font-medium text-sm">
                  <span className="text-brand-400">1.</span> Ativar a partilha
                </p>
                <p className="text-gray-400 text-xs mt-0.5">
                  Necessário para que os visitantes da tua loja consigam ver o modelo.
                </p>
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
                aria-label="Ativar partilha"
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${model.is_public ? 'bg-brand-600' : 'bg-gray-600'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${model.is_public ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Passo 2 — copiar o código */}
            <div className="border-t border-white/10 pt-4 mt-4">
              <div className="flex items-center justify-between gap-4 mb-2">
                <p className="font-medium text-sm">
                  <span className="text-brand-400">2.</span> Copiar o código e colar na página do produto
                </p>
                {model.is_public && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(embedCode)
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                    }}
                    className="text-xs bg-brand-600 hover:bg-brand-500 px-3 py-1.5 rounded-lg shrink-0"
                  >
                    {copied ? 'Copiado ✓' : 'Copiar código'}
                  </button>
                )}
              </div>

              {model.is_public ? (
                <>
                  <code className="block bg-gray-900 rounded-lg p-4 text-xs text-green-400 break-all">
                    {embedCode}
                  </code>
                  <a
                    href={`/embed/${model.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-400 hover:text-brand-300 text-xs mt-3 inline-block"
                  >
                    Pré-visualizar como o cliente vê →
                  </a>
                </>
              ) : (
                <p className="text-gray-500 text-xs">
                  Ativa a partilha acima para obteres o código.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
