'use client'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n'
import StatusBadge from './StatusBadge'

type Model = {
  id: string
  name: string
  status: string
  input_type: string
  frames_count: number
  thumbnail_url: string | null
  created_at: string
  expires_at: string
}

export default function ModelCard({ model, onDelete }: { model: Model; onDelete: (id: string) => void }) {
  const { lang, t } = useI18n()
  const expiresAt = new Date(model.expires_at)
  const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition">
      {/* Thumbnail / placeholder */}
      <Link href={`/model/${model.id}`} className="block mb-3">
        <div className="aspect-square rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center">
          {model.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={model.thumbnail_url} alt={model.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-4xl opacity-40">
              {model.status === 'done' ? '🧊' : model.status === 'error' ? '⚠️' : '⏳'}
            </span>
          )}
        </div>
      </Link>

      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-gray-900 truncate flex-1">{model.name}</h3>
        <StatusBadge status={model.status} />
      </div>

      <p className="text-xs text-gray-400 mb-4">
        {t('card.created')} {new Date(model.created_at).toLocaleDateString(lang === 'pt' ? 'pt-PT' : 'en-GB')}
      </p>

      {daysLeft <= 7 && model.status === 'done' && (
        <p className="text-xs text-orange-500 mb-3">⚠ {t('card.expires')} {daysLeft} {t('card.days')}</p>
      )}

      <div className="flex gap-2">
        {model.status === 'done' && (
          <Link
            href={`/model/${model.id}`}
            className="flex-1 text-center text-sm bg-brand-600 text-white py-1.5 rounded-lg hover:bg-brand-500"
          >
            {t('card.view')}
          </Link>
        )}
        {model.status === 'pending' || model.status === 'processing' || model.status === 'extracting' ? (
          <Link href={`/model/${model.id}`} className="flex-1 text-center text-sm border border-gray-300 text-gray-600 py-1.5 rounded-lg">
            {t('card.progress')}
          </Link>
        ) : null}
        <button
          onClick={() => onDelete(model.id)}
          className="text-sm text-red-400 hover:text-red-600 px-2"
          title={t('card.delete')}
        >
          🗑
        </button>
      </div>
    </div>
  )
}
