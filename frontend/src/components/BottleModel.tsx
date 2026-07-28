'use client'
import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'

/**
 * Garrafa 3D em WebGL, gerada por revolução (LatheGeometry) a partir do
 * mesmo perfil das fotos de entrada: corpo 30×51 com canto rx=8 e tampa 14×12.
 * Sem HDRI externo — a iluminação é toda local (rápida e sem dependências de rede).
 */

const R_BODY = 1                  // raio do corpo (referência)
const H_BODY = 51 / 15            // altura do corpo
const CORNER = 8 / 15             // canto arredondado no topo
const R_CAP = 7 / 15              // raio da tampa
const H_CAP = 12 / 15             // altura da tampa
const TOTAL = H_BODY + H_CAP

function bodyProfile() {
  const p: THREE.Vector2[] = []
  p.push(new THREE.Vector2(0, 0))
  p.push(new THREE.Vector2(R_BODY - 0.06, 0))
  p.push(new THREE.Vector2(R_BODY, 0.07))          // pequeno filete na base
  p.push(new THREE.Vector2(R_BODY, H_BODY - CORNER))
  // canto superior: quarto de circunferência
  const cx = R_BODY - CORNER
  const cy = H_BODY - CORNER
  for (let i = 1; i <= 10; i++) {
    const a = (i / 10) * (Math.PI / 2)
    p.push(new THREE.Vector2(cx + CORNER * Math.cos(a), cy + CORNER * Math.sin(a)))
  }
  p.push(new THREE.Vector2(0, H_BODY))             // topo plano
  return p
}

function capProfile() {
  const p: THREE.Vector2[] = []
  p.push(new THREE.Vector2(0, 0))
  p.push(new THREE.Vector2(R_CAP + 0.03, 0))
  p.push(new THREE.Vector2(R_CAP + 0.03, H_CAP - 0.08))
  p.push(new THREE.Vector2(R_CAP - 0.02, H_CAP))   // topo ligeiramente chanfrado
  p.push(new THREE.Vector2(0, H_CAP))
  return p
}

function Bottle() {
  const group = useRef<THREE.Group>(null)
  const body = useMemo(() => bodyProfile(), [])
  const cap = useMemo(() => capProfile(), [])

  useFrame((_, dt) => {
    if (group.current) group.current.rotation.y += dt * 0.45
  })

  return (
    <group ref={group} position={[0, -TOTAL / 2, 0]}>
      <mesh castShadow>
        <latheGeometry args={[body, 72]} />
        <meshStandardMaterial color="#38bdf8" roughness={0.28} metalness={0.08} />
      </mesh>
      <mesh position={[0, H_BODY, 0]} castShadow>
        <latheGeometry args={[cap, 48]} />
        <meshStandardMaterial color="#075985" roughness={0.4} metalness={0.1} />
      </mesh>
    </group>
  )
}

export default function BottleModel({ size = 150 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size * 1.5 }}>
      <Canvas
        dpr={[1, 2]}
        /* distância calculada para caber a garrafa inteira (4.2u) + margem */
        camera={{ position: [0, 0.25, 9], fov: 32 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.55} />
        <directionalLight position={[3.5, 5, 4]} intensity={2.1} />
        <directionalLight position={[-4, 1.5, -2]} intensity={0.55} color="#bae6fd" />
        <directionalLight position={[0, 2, -5]} intensity={0.9} color="#7dd3fc" />
        <Bottle />
        <ContactShadows position={[0, -TOTAL / 2 - 0.02, 0]} opacity={0.35} scale={5} blur={2.4} far={3} />
      </Canvas>
    </div>
  )
}
