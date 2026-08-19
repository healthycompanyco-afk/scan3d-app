'use client'
import { useI18n } from '@/lib/i18n'

export default function UsageBar({ used, limit }: { used: number; limit: number }) {
  const { t } = useI18n()
  const isUnlimited = limit === Infinity
  const pct = isUnlimited ? 0 : Math.min((used / limit) * 100, 100)
  const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-orange-400' : 'bg-brand-500'

  return (
    <div className="text-right">
      <p className="text-sm text-gray-500 mb-1">
        {used} / {isUnlimited ? '∞' : limit} {t('dash.usage')}
      </p>
      {!isUnlimited && (
        <div className="w-40 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  )
}
