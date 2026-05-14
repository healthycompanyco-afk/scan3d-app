'use client'
import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF, Environment, Center } from '@react-three/drei'

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url)
  return <primitive object={scene} />
}

export default function ModelViewer({ url }: { url: string }) {
  return (
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
  )
}
