'use client'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useI18n } from '@/lib/i18n'

const ModelViewer = dynamic(() => import('./ModelViewer'), { ssr: false })

type Example = {
  id: string
  name: string
  source_url: string | null
  thumbnail_url: string | null
  model_url: string | null
}

/**
 * Galeria de exemplos reais: mostra o par "foto de entrada → modelo gerado".
 * Alimenta-se dos modelos que o utilizador marcou como públicos.
 * Se não houver nenhum, a secção não aparece.
 */
export default function ExamplesGallery() {
  const { t } = useI18n()
  const supabase = createClientComponentClient()
  const [items, setItems] = useState<Example[]>([])
  const [open, setOpen] = useState<Example | null>(null)

  useEffect(() => {
    supabase
      .from('models')
      .select('id, name, source_url, thumbnail_url, model_url')
      .eq('is_public', true)
      .eq('status', 'done')
      .not('thumbnail_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(6)
      .then(({ data }) => setItems(data ?? []))
  }, [supabase])

  if (items.length === 0) return null

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 sm:px-8">
        <h2 className="text-3xl font-bold text-center mb-3 tracking-tight">{t('gallery.title')}</h2>
        <p className="text-gray-500 text-center mb-12">{t('gallery.subtitle')}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map(ex => (
            <button
              key={ex.id}
              onClick={() => ex.model_url && setOpen(ex)}
              className="text-left bg-white rounded-2xl border border-gray-100 overflow-hidden
                         hover:border-brand-200 hover:shadow-lg hover:shadow-brand-600/5 transition-all group"
            >
              <div className="grid grid-cols-2 gap-px bg-gray-100 relative">
                <figure className="bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={ex.source_url ?? ex.thumbnail_url ?? ''}
                    alt=""
                    className="w-full aspect-square object-cover"
                  />
                  <figcaption className="text-[10px] text-gray-400 text-center py-1.5">
                    {t('gallery.photo')}
                  </figcaption>
                </figure>
                <figure className="bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ex.thumbnail_url ?? ''} alt={ex.name} className="w-full aspect-square object-cover" />
                  <figcaption className="text-[10px] text-brand-600 font-medium text-center py-1.5">
                    {t('gallery.model')}
                  </figcaption>
                </figure>
                <span
                  aria-hidden
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full
                             bg-white border border-gray-200 text-brand-600 text-xs flex items-center justify-center shadow-sm"
                >
                  →
                </span>
              </div>
              <div className="px-4 py-3 flex items-center justify-between gap-2">
                <span className="font-medium text-sm text-gray-800 truncate">{ex.name}</span>
                {ex.model_url && (
                  <span className="text-xs text-brand-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    {t('gallery.view')}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Atribuição exigida pela licença CC BY 4.0 das fotos de demonstração */}
        <p className="text-center text-xs text-gray-400 mt-8">
          {t('gallery.credit')}{' '}
          <a
            href="https://creativecommons.org/licenses/by/4.0/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-gray-600"
          >
            CC BY 4.0
          </a>
        </p>
      </div>

      {/* Visualizador interativo (só carrega WebGL quando abres um exemplo) */}
      {open?.model_url && (
        <div
          className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setOpen(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-gray-900 rounded-2xl overflow-hidden w-full max-w-3xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
              <span className="text-white font-medium text-sm">{open.name}</span>
              <button onClick={() => setOpen(null)} className="text-gray-400 hover:text-white text-xl leading-none">
                ×
              </button>
            </div>
            <div style={{ height: 460 }}>
              <ModelViewer url={open.model_url} />
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
