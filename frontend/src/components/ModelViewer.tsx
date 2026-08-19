'use client'
import { Suspense, Component, ReactNode } from 'react'
import { useI18n } from '@/lib/i18n'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF, Environment, Center, Bounds, ContactShadows } from '@react-three/drei'

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url)
  return <primitive object={scene} />
}

class ErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  render() {
    if (this.state.hasError) return this.props.fallback
    return this.props.children
  }
}

export default function ModelViewer({ url }: { url: string }) {
  const { t } = useI18n()
  return (
    <ErrorBoundary
      fallback={
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800 text-gray-400">
          <svg className="w-12 h-12 mb-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="font-semibold text-red-400">{t('model.viewerError')}</p>
          <p className="text-sm mt-1">{t('model.viewerErrorHint')}</p>
        </div>
      }
    >
      <Canvas camera={{ position: [0, 0.5, 3], fov: 45 }} style={{ width: '100%', height: '100%' }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />
        <directionalLight position={[-5, 3, -5]} intensity={0.4} />
        <Suspense fallback={null}>
          <Bounds fit clip observe margin={1.2}>
            <Center>
              <Model url={url} />
            </Center>
          </Bounds>
          <ContactShadows position={[0, -1, 0]} opacity={0.35} scale={10} blur={2.5} far={4} />
          <Environment preset="studio" />
        </Suspense>
        <OrbitControls
          makeDefault
          autoRotate
          autoRotateSpeed={1.2}
          enableZoom
          enablePan
          minPolarAngle={0.2}
          maxPolarAngle={Math.PI / 1.8}
        />
      </Canvas>
    </ErrorBoundary>
  )
}
