'use client'
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import ModelViewer from '@/components/ModelViewer'
import SplatViewer from '@/components/SplatViewer'
import Watermark from '@/components/Watermark'
import { useI18n } from '@/lib/i18n'

export default function EmbedPage({ params }: { params: { id: string } }) {
  const { t } = useI18n()
  const [modelUrl, setModelUrl] = useState<string | null>(null)
  const [splatUrl, setSplatUrl] = useState<string | null>(null)
  const [watermark, setWatermark] = useState(false)
  const [error, setError] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    supabase
      .from('models')
      .select('model_url, splat_url, watermark, status, is_public')
      .eq('id', params.id)
      .single()
      .then(({ data }) => {
        if (!data || !data.is_public || data.status !== 'done') {
          setError(true)
          return
        }
        setModelUrl(data.model_url)
        setSplatUrl(data.splat_url)
        setWatermark(!!data.watermark)
      })
  }, [params.id, supabase])

  if (error) {
    return (
      <div style={{ width: '100%', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', color: '#888', fontFamily: 'sans-serif' }}>
        {t('model.unavailable')}
      </div>
    )
  }

  if (!modelUrl) {
    return (
      <div style={{ width: '100%', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111' }}>
        <div style={{ width: 40, height: 40, border: '4px solid #0ea5e9', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: '100vh', background: '#111', position: 'relative' }}>
      {splatUrl ? <SplatViewer url={splatUrl} /> : <ModelViewer url={modelUrl} />}
      {/* Marca de água só no plano grátis */}
      {watermark && <Watermark />}
    </div>
  )
}
