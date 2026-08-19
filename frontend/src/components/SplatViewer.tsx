'use client'
import { useEffect, useRef, useState } from 'react'
import { useI18n } from '@/lib/i18n'

/**
 * Visualizador de Gaussian Splatting (.ply do TRELLIS).
 * Preserva cores reais e brilho dependente do ângulo de visão.
 */
export default function SplatViewer({ url }: { url: string }) {
  const { t } = useI18n()
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!containerRef.current) return
    let viewer: any = null
    let disposed = false

    // Import dinâmico (a lib usa WebGL → só no browser)
    import('@mkkellogg/gaussian-splats-3d')
      .then((GaussianSplats3D) => {
        if (disposed || !containerRef.current) return

        viewer = new GaussianSplats3D.Viewer({
          rootElement: containerRef.current,
          cameraUp: [0, 1, 0],
          initialCameraPosition: [0, 0, -2.5],
          initialCameraLookAt: [0, 0, 0],
          sharedMemoryForWorkers: false, // evita necessidade de headers COOP/COEP no Vercel
          useBuiltInControls: true,
          dynamicScene: false,
        })

        return viewer
          .addSplatScene(url, {
            splatAlphaRemovalThreshold: 5,
            showLoadingUI: false,
            // TRELLIS exporta com Y para baixo → rodar 180° em Z para ficar direito
            rotation: [0, 0, 1, 0],
          })
          .then(() => {
            if (disposed) return
            viewer.start()
            setLoading(false)
          })
      })
      .catch((e: unknown) => {
        console.error('Erro ao carregar splat:', e)
        setError(true)
        setLoading(false)
      })

    return () => {
      disposed = true
      if (viewer) {
        try {
          viewer.dispose()
        } catch {
          /* ignore */
        }
      }
    }
  }, [url])

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800 text-gray-400">
        <p className="font-semibold text-red-400">{t('model.splatError')}</p>
        <p className="text-sm mt-1">{t('model.splatErrorHint')}</p>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800 z-10">
          <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-gray-300 text-sm">{t('model.splatLoading')}</p>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
}
