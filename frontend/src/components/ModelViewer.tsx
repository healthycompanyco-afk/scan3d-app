'use client'
import { Suspense, Component, ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF, Environment, Center } from '@react-three/drei'

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
  return (
    <ErrorBoundary
      fallback={
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800 text-gray-400">
          <svg className="w-12 h-12 mb-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="font-semibold text-red-400">Não foi possível carregar o modelo 3D</p>
          <p className="text-sm mt-1">O ficheiro pode estar corrompido ou em falta.</p>
        </div>
      }
    >
      <Canvas camera={{ position: [0, 0, 3], fov: 50 }} style={{ width: '100%', height: '100%' }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Suspense fallback={null}>
          <Center>
            <Model url={url} />
          </Center>
          <Environment preset="studio" />
        </Suspense>
        <OrbitControls autoRotate autoRotateSpeed={1} enableZoom enablePan />
      </Canvas>
    </ErrorBoundary>
  )
}
