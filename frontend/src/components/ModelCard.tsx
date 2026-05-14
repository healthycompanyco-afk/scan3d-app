import Link from 'next/link'
import StatusBadge from './StatusBadge'

type Model = {
  id: string
  name: string
  status: string
  input_type: string
  frames_count: number
  created_at: string
  expires_at: string
}

export default function ModelCard({ model, onDelete }: { model: Model; onDelete: (id: string) => void }) {
  const expiresAt = new Date(model.expires_at)
  const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-gray-900 truncate flex-1">{model.name}</h3>
        <StatusBadge status={model.status} />
      </div>

      <p className="text-xs text-gray-400 mb-1">
        {model.input_type === 'video' ? '🎥 Vídeo' : '📷 Fotos'}
        {model.frames_count ? ` · ${model.frames_count} frames` : ''}
      </p>
      <p className="text-xs text-gray-400 mb-4">
        Criado em {new Date(model.created_at).toLocaleDateString('pt-PT')}
      </p>

      {daysLeft <= 7 && model.status === 'done' && (
        <p className="text-xs text-orange-500 mb-3">⚠ Expira em {daysLeft} dias</p>
      )}

      <div className="flex gap-2">
        {model.status === 'done' && (
          <Link
            href={`/model/${model.id}`}
            className="flex-1 text-center text-sm bg-brand-600 text-white py-1.5 rounded-lg hover:bg-brand-500"
          >
            Ver modelo
          </Link>
        )}
        {model.status === 'pending' || model.status === 'processing' || model.status === 'extracting' ? (
          <Link href={`/model/${model.id}`} className="flex-1 text-center text-sm border border-gray-300 text-gray-600 py-1.5 rounded-lg">
            Ver progresso
          </Link>
        ) : null}
        <button
          onClick={() => onDelete(model.id)}
          className="text-sm text-red-400 hover:text-red-600 px-2"
          title="Apagar modelo"
        >
          🗑
        </button>
      </div>
    </div>
  )
}
