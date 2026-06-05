'use client'
import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import PhotoUploader from '@/components/PhotoUploader'
import VideoUploader from '@/components/VideoUploader'

type InputMode = 'ai_single' | 'video' | 'photos'

export default function UploadPage() {
  const [mode, setMode] = useState<InputMode>('ai_single')
  const [name, setName] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClientComponentClient()
  const router = useRouter()

  async function handleSubmit() {
    if (!name.trim()) { setError('Dá um nome ao modelo.'); return }
    if (files.length === 0) { setError('Carrega pelo menos um ficheiro.'); return }
    if (mode === 'ai_single' && files.length > 1) { setError('O modo IA usa apenas 1 foto.'); return }

    setUploading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: model, error: dbError } = await supabase
        .from('models')
        .insert({ user_id: user.id, name, input_type: mode, status: 'pending' })
        .select()
        .single()

      if (dbError) throw dbError

      const uploadPromises = files.map(file => {
        const path = `${user.id}/${model.id}/${file.name}`
        return supabase.storage.from('uploads').upload(path, file)
      })
      await Promise.all(uploadPromises)

      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/reconstruct`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_id: model.id, user_id: user.id, input_type: mode }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Erro desconhecido' }))
        throw new Error(err.detail || `Erro ${res.status}`)
      }

      router.push(`/model/${model.id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao fazer upload.')
      setUploading(false)
    }
  }

  const modes: { id: InputMode; emoji: string; label: string; sublabel: string }[] = [
    { id: 'ai_single', emoji: '✨', label: 'IA (recomendado)', sublabel: '1 foto · alta qualidade · ~1-2 min' },
    { id: 'video',     emoji: '🎥', label: 'Vídeo',    sublabel: 'melhor qualidade · ~20 min' },
    { id: 'photos',    emoji: '📷', label: 'Fotos',    sublabel: '30-80 fotos · ~20 min' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-8 py-4">
        <span className="text-xl font-bold text-brand-600">Scan3D</span>
      </nav>

      <div className="max-w-2xl mx-auto px-8 py-10">
        <h1 className="text-2xl font-bold mb-2">Novo modelo 3D</h1>
        <p className="text-gray-500 text-sm mb-8">Escolhe como queres capturar o produto.</p>

        {/* Nome */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome do produto</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ex: Ténis Nike Air Max"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Modo */}
        <div className="flex gap-3 mb-6">
          {modes.map(m => (
            <button
              key={m.id}
              onClick={() => { setMode(m.id); setFiles([]) }}
              className={`flex-1 py-3 px-2 rounded-xl border-2 transition text-center ${
                mode === m.id
                  ? 'border-brand-600 bg-brand-50 text-brand-700'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              <div className="text-xl mb-0.5">{m.emoji}</div>
              <div className="font-semibold text-sm">{m.label}</div>
              <div className="text-xs opacity-70">{m.sublabel}</div>
            </button>
          ))}
        </div>

        {/* Uploader */}
        {mode === 'ai_single' ? (
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-white">
            <input
              type="file"
              accept="image/*"
              onChange={e => setFiles(e.target.files ? [e.target.files[0]] : [])}
              className="hidden"
              id="ai-input"
            />
            <label htmlFor="ai-input" className="cursor-pointer">
              {files.length > 0 ? (
                <div>
                  <p className="text-green-600 font-semibold">✓ {files[0].name}</p>
                  <p className="text-gray-400 text-sm mt-1">Clica para mudar</p>
                </div>
              ) : (
                <div>
                  <p className="text-4xl mb-2">🖼️</p>
                  <p className="font-semibold text-gray-700">Clica para escolher 1 foto</p>
                  <p className="text-gray-400 text-sm mt-1">JPG, PNG ou WEBP</p>
                </div>
              )}
            </label>
          </div>
        ) : mode === 'video' ? (
          <VideoUploader onFile={f => setFiles([f])} />
        ) : (
          <PhotoUploader onFiles={setFiles} />
        )}

        {/* Dicas */}
        <div className="bg-blue-50 rounded-xl p-4 mt-4 text-sm text-blue-800">
          {mode === 'ai_single' ? (
            <>
              <strong>✨ Modo IA (TRELLIS) — dicas para melhor resultado:</strong>
              <ul className="mt-1 space-y-1 list-disc list-inside">
                <li>Fotografa o produto de frente, ligeiramente acima</li>
                <li>Fundo simples — o fundo é removido automaticamente</li>
                <li>Boa iluminação, sem sombras duras</li>
                <li>Produto centrado e a ocupar &gt;70% da foto</li>
                <li>Gera malha 3D com textura real (qualidade de e-commerce)</li>
              </ul>
            </>
          ) : mode === 'video' ? (
            <>
              <strong>Dicas para um bom vídeo:</strong>
              <ul className="mt-1 space-y-1 list-disc list-inside">
                <li>Filma 30-60 segundos a andar devagar à volta do produto</li>
                <li>Usa boa iluminação (sem sombras fortes)</li>
                <li>Mantém o produto no centro do ecrã</li>
                <li>Produtos foscos resultam melhor</li>
              </ul>
            </>
          ) : (
            <>
              <strong>Dicas para boas fotos:</strong>
              <ul className="mt-1 space-y-1 list-disc list-inside">
                <li>Mínimo 30 fotos, idealmente 50-80</li>
                <li>Cobre todos os ângulos: frente, trás, cima, baixo, lados</li>
                <li>Cada foto deve ter 60-80% de sobreposição com a anterior</li>
                <li>Fundo simples (branco ou cinzento)</li>
              </ul>
            </>
          )}
        </div>

        {error && <p className="text-red-600 text-sm mt-4">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={uploading || files.length === 0}
          className="w-full bg-brand-600 text-white py-3 rounded-xl font-semibold mt-6 hover:bg-brand-500 disabled:opacity-50"
        >
          {uploading ? 'A enviar...' : 'Gerar modelo 3D →'}
        </button>
      </div>
    </div>
  )
}
