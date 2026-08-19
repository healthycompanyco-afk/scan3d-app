'use client'
import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import PhotoGuide from '@/components/PhotoGuide'
import Logo from '@/components/Logo'
import { apiPost } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import LanguageToggle from '@/components/LanguageToggle'

export default function UploadPage() {
  const [name, setName] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [loadingSample, setLoadingSample] = useState(false)
  const supabase = createClientComponentClient()
  const router = useRouter()
  const { t } = useI18n()

  /** Carrega um conjunto de fotos de demonstração, para quem quer ver o
   *  resultado antes de ir fotografar o próprio produto. */
  async function usarExemplo() {
    setLoadingSample(true)
    setError('')
    try {
      const nomes = ['tenis_0', 'tenis_1', 'tenis_2', 'tenis_3', 'tenis_4']
      const ficheiros = await Promise.all(
        nomes.map(async n => {
          const r = await fetch(`/exemplos/${n}.jpg`)
          const blob = await r.blob()
          return new File([blob], `${n}.jpg`, { type: 'image/jpeg' })
        })
      )
      setFiles(ficheiros)
      if (!name.trim()) setName(t('up.sampleName'))
    } catch {
      setError(t('up.errSample'))
    }
    setLoadingSample(false)
  }

  function onPick(selected: FileList | null) {
    if (!selected) return
    setFiles(Array.from(selected).slice(0, 6))
  }

  async function handleSubmit() {
    if (!name.trim()) { setError(t('up.errName')); return }
    if (files.length === 0) { setError(t('up.errNoPhotos')); return }
    if (files.length > 6) { setError(t('up.errMax')); return }

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
      setError(e instanceof Error ? e.message : t('up.errUpload'))
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-8 py-4 flex items-center justify-between">
        <Logo height={32} />
        <LanguageToggle />
      </nav>

      <div className="max-w-2xl mx-auto px-8 py-10">
        <h1 className="text-2xl font-bold mb-2">{t('up.title')}</h1>
        <p className="text-gray-500 text-sm mb-8">
          {t('up.subtitle')}
        </p>

        {/* Atalho: experimentar sem ter de ir fotografar */}
        <div className="mb-6 rounded-xl border border-brand-200 bg-brand-50 px-5 py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-brand-900 text-sm">{t('up.sampleTitle')}</p>
            <p className="text-brand-800 text-sm">
              {t('up.sampleBody')}
            </p>
          </div>
          <button
            onClick={usarExemplo}
            disabled={loadingSample}
            className="bg-white border border-brand-300 text-brand-700 px-4 py-2 rounded-lg text-sm
                       font-medium hover:bg-brand-100 disabled:opacity-50 shrink-0"
          >
            {loadingSample ? t('up.sampleLoading') : t('up.sampleBtn')}
          </button>
        </div>

        {/* Guia de fotos */}
        <PhotoGuide />

        {/* Nome */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('up.nameLabel')}</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={t('up.namePlaceholder')}
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
                  ✓ {files.length} {files.length === 1 ? t('up.selected1') : t('up.selectedN')}
                </p>
                <p className="text-gray-400 text-sm mt-1">{t('up.changeSelection')}</p>
              </div>
            ) : (
              <div>
                <p className="text-4xl mb-2">🖼️</p>
                <p className="font-semibold text-gray-700">{t('up.pickPhotos')}</p>
                <p className="text-gray-400 text-sm mt-1">{t('up.pickHint')}</p>
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
            💡 {t('up.onePhotoHint')}
          </p>
        )}

        {error && <p className="text-red-600 text-sm mt-4">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={uploading || files.length === 0}
          className="w-full bg-brand-600 text-white py-3 rounded-xl font-semibold mt-6 hover:bg-brand-500 disabled:opacity-50"
        >
          {uploading ? t('up.sending') : t('up.submit')}
        </button>
      </div>
    </div>
  )
}
