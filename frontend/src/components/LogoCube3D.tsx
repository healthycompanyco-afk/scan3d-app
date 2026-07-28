'use client'
import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'

/**
 * Cubo do logótipo Snap3D em 3D real (o SVG é plano — rodá-lo em CSS
 * pareceria um autocolante a girar, não um cubo).
 * `variant`: 'dark' para fundos claros, 'light' para fundos escuros.
 */

const SIDE = 1.5
const HALF = SIDE / 2

/**
 * Cor por face (ordem do BoxGeometry: +X, -X, +Y, -Y, +Z, -Z), a imitar o
 * contraste do logótipo: topo branco, lados em tons distintos.
 * O contraste entre faces é também o que torna a rotação percetível.
 */
const FACES = {
  dark:  ['#0a0a0a', '#6b7280', '#ffffff', '#374151', '#1f2937', '#9ca3af'],
  light: ['#cbd5e1', '#94a3b8', '#ffffff', '#475569', '#e2e8f0', '#64748b'],
}

function Cube({ variant, speed }: { variant: 'dark' | 'light'; speed: number }) {
  const group = useRef<THREE.Group>(null)
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(SIDE, SIDE, SIDE)), [])
  const lensColor = '#0f172a'

  useFrame((_, dt) => {
    if (group.current) group.current.rotation.y += dt * speed
  })

  return (
    <group ref={group} rotation={[0.16, 0.6, 0]}>
      <mesh>
        <boxGeometry args={[SIDE, SIDE, SIDE]} />
        {FACES[variant].map((c, i) => (
          <meshStandardMaterial key={i} attach={`material-${i}`} color={c} roughness={0.5} metalness={0.05} />
        ))}
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color={variant === 'light' ? '#f8fafc' : '#0a0a0a'} opacity={0.5} transparent />
      </lineSegments>

      {/* abertura de lente na face de topo (o "snap" do logótipo) */}
      <mesh position={[0, HALF + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.34, 0.032, 10, 48]} />
        <meshStandardMaterial color={lensColor} roughness={0.5} />
      </mesh>
      <mesh position={[0, HALF + 0.02, 0]}>
        <sphereGeometry args={[0.075, 16, 12]} />
        <meshStandardMaterial color={lensColor} roughness={0.5} />
      </mesh>
    </group>
  )
}

export default function LogoCube3D({
  size = 72,
  variant = 'dark',
  speed = 0.5,
}: {
  size?: number
  variant?: 'dark' | 'light'
  speed?: number
}) {
  return (
    <div style={{ width: size, height: size }} aria-hidden>
      {/* elevação ~31° (vista isométrica, como no logótipo) e distância
          folgada para o cubo não ser cortado ao rodar (diagonal ≈ 2.1u) */}
      <Canvas dpr={[1, 2]} camera={{ position: [0, 2.8, 4.6], fov: 30 }} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.85} />
        <directionalLight position={[3, 4, 3]} intensity={1.3} />
        <directionalLight position={[-3, 1, -2]} intensity={0.45} />
        <Cube variant={variant} speed={speed} />
      </Canvas>
    </div>
  )
}
