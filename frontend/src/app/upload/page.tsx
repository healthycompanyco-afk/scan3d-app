'use client'
import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import PhotoGuide from '@/components/PhotoGuide'
import Logo from '@/components/Logo'
import { apiPost } from '@/lib/api'

export default function UploadPage() {
  const [name, setName] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClientComponentClient()
  const router = useRouter()

  function onPick(selected: FileList | null) {
    if (!selected) return
    setFiles(Array.from(selected).slice(0, 6))
  }

  async function handleSubmit() {
    if (!name.trim()) { setError('Dá um nome ao produto.'); return }
    if (files.length === 0) { setError('Carrega pelo menos 1 foto.'); return }
    if (files.length > 6) { setError('Máximo 6 fotos.'); return }

    setUploading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: model, error: dbError } = await supabase
        .from('models')
        .insert({ user_id: user.id, name, input_type: 'ai_single', status: 'pending' })
        .select()
        .single()

      if (dbError) throw dbError

      const uploadPromises = files.map(file => {
        const path = `${user.id}/${model.id}/${file.name}`
        return supabase.storage.from('uploads').upload(path, file)
      })
      await Promise.all(uploadPromises)

      const res = await apiPost('/reconstruct', {
        model_id: model.id, user_id: user.id, input_type: 'ai_single',
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

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-8 py-4">
        <Logo height={32} />
      </nav>

      <div className="max-w-2xl mx-auto px-8 py-10">
        <h1 className="text-2xl font-bold mb-2">Novo modelo 3D</h1>
        <p className="text-gray-500 text-sm mb-8">
          Carrega 4 a 6 fotos do teu produto e a nossa IA gera um modelo 3D fotorrealista.
        </p>

        {/* Guia de fotos */}
        <PhotoGuide />

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

        {/* Uploader de fotos */}
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-white">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={e => onPick(e.target.files)}
            className="hidden"
            id="photo-input"
          />
          <label htmlFor="photo-input" className="cursor-pointer">
            {files.length > 0 ? (
              <div>
                <p className="text-green-600 font-semibold">
                  ✓ {files.length} {files.length === 1 ? 'foto selecionada' : 'fotos selecionadas'}
                </p>
                <p className="text-gray-400 text-sm mt-1">Clica para mudar a seleção</p>
              </div>
            ) : (
              <div>
                <p className="text-4xl mb-2">🖼️</p>
                <p className="font-semibold text-gray-700">Clica para escolher 4 a 6 fotos</p>
                <p className="text-gray-400 text-sm mt-1">Vários ângulos do mesmo produto · JPG, PNG ou WEBP</p>
              </div>
            )}
          </label>
        </div>

        {/* Pré-visualização das fotos escolhidas */}
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {files.map((f, i) => (
              <div key={i} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={URL.createObjectURL(f)}
                  alt={`foto ${i + 1}`}
                  className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                />
              </div>
            ))}
          </div>
        )}

        {files.length === 1 && (
          <p className="text-amber-600 text-sm mt-3">
            💡 Só 1 foto funciona, mas com 4-6 fotos de ângulos diferentes o modelo fica muito melhor.
          </p>
        )}

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
