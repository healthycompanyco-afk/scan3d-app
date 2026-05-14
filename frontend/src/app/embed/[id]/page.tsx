'use client'
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import ModelViewer from '@/components/ModelViewer'

export default function EmbedPage({ params }: { params: { id: string } }) {
  const [modelUrl, setModelUrl] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    supabase
      .from('models')
      .select('model_url, status, is_public')
      .eq('id', params.id)
      .single()
      .then(({ data }) => {
        if (!data || !data.is_public || data.status !== 'done') {
          setError(true)
          return
        }
        setModelUrl(data.model_url)
      })
  }, [params.id, supabase])

  if (error) {
    return (
      <div style={{ width: '100%', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', color: '#888', fontFamily: 'sans-serif' }}>
        Modelo não disponível
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
      <ModelViewer url={modelUrl} />
      {/* Branding discreto */}
      <a
        href="/"
        target="_blank"
        rel="noopener"
        style={{ position: 'absolute', bottom: 8, right: 12, fontSize: 11, color: '#555', textDecoration: 'none' }}
      >
        Scan3D
      </a>
    </div>
  )
}
