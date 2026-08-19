'use client'
import { useI18n } from '@/lib/i18n'

const CLASSES: Record<string, string> = {
  pending:    'bg-gray-100 text-gray-600',
  extracting: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  done:       'bg-green-100 text-green-700',
  error:      'bg-red-100 text-red-600',
}

export default function StatusBadge({ status }: { status: string }) {
  const { t } = useI18n()
  const chave = status in CLASSES ? status : 'pending'
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full ${CLASSES[chave]}`}>
      {t(`status.${chave}`)}
    </span>
  )
}
