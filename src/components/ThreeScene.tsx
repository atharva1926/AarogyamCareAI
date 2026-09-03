import { Canvas, useFrame } from '@react-three/fiber'
import { Float, OrbitControls } from '@react-three/drei'
import { useMemo, useRef } from 'react'
import type { Group, Mesh, Points } from 'three'
import { useReducedMotion } from '../hooks/useMedia'
import { cn } from '../utils'

export type SceneVariant = 'landing' | 'auth' | 'dashboard' | '404'

function Particles({ count, reduced }: { count: number; reduced: boolean }) {
  const ref = useRef<Points>(null)
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i += 1) {
      arr[i * 3] = (Math.random() - 0.5) * 8
      arr[i * 3 + 1] = (Math.random() - 0.5) * 8
      arr[i * 3 + 2] = (Math.random() - 0.5) * 8
    }
    return arr
  }, [count])

  useFrame((_, delta) => {
    if (reduced || !ref.current) return
    ref.current.rotation.y += delta * 0.05
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.035} color="#5eead4" transparent opacity={0.7} />
    </points>
  )
}

function MedicalSphere({ reduced }: { reduced: boolean }) {
  const mesh = useRef<Mesh>(null)
  const pulse = useRef<Mesh>(null)

  useFrame((state, delta) => {
    if (!mesh.current) return
    if (!reduced) mesh.current.rotation.y += delta * 0.22
    if (pulse.current && !reduced) {
      const scale = 1.35 + Math.sin(state.clock.elapsedTime * 2.2) * 0.08
      pulse.current.scale.setScalar(scale)
    }
  })

  return (
    <group>
      <mesh ref={mesh}>
        <icosahedronGeometry args={[1.15, 2]} />
        <meshStandardMaterial color="#14b8a6" wireframe transparent opacity={0.55} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.72, 32, 32]} />
        <meshStandardMaterial color="#0ea5e9" transparent opacity={0.28} />
      </mesh>
      <mesh ref={pulse}>
        <ringGeometry args={[1.25, 1.32, 64]} />
        <meshBasicMaterial color="#2dd4bf" transparent opacity={0.35} />
      </mesh>
    </group>
  )
}

function MedicalCross() {
  return (
    <Float speed={1.4} rotationIntensity={0.2} floatIntensity={0.4}>
      <group position={[1.8, 0.9, 0]} rotation={[0.2, 0.4, 0]}>
        <mesh>
          <boxGeometry args={[0.18, 0.7, 0.18]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh>
          <boxGeometry args={[0.7, 0.18, 0.18]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      </group>
    </Float>
  )
}

function DataNodes({ reduced }: { reduced: boolean }) {
  const group = useRef<Group>(null)
  useFrame((_, delta) => {
    if (reduced || !group.current) return
    group.current.rotation.y -= delta * 0.12
  })
  const nodes = [
    [-1.8, 0.4, 0.6],
    [0.2, -1.4, 0.8],
    [1.4, 0.2, -1.1],
  ] as const
  return (
    <group ref={group}>
      {nodes.map(([x, y, z]) => (
        <mesh key={`${x}-${y}-${z}`} position={[x, y, z]}>
          <octahedronGeometry args={[0.12, 0]} />
          <meshStandardMaterial color="#38bdf8" emissive="#0ea5e9" emissiveIntensity={0.4} />
        </mesh>
      ))}
    </group>
  )
}

function SceneContent({ variant, reduced }: { variant: SceneVariant; reduced: boolean }) {
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[4, 4, 3]} intensity={1.1} />
      <pointLight position={[-3, -2, 2]} color="#14b8a6" intensity={0.8} />
      <MedicalSphere reduced={reduced} />
      {variant !== 'dashboard' && <MedicalCross />}
      <DataNodes reduced={reduced} />
      <Particles count={variant === 'dashboard' ? 40 : 90} reduced={reduced} />
      {variant === '404' && (
        <Float>
          <mesh position={[0, -1.8, 0]}>
            <torusGeometry args={[0.55, 0.08, 16, 48]} />
            <meshStandardMaterial color="#64748b" />
          </mesh>
        </Float>
      )}
    </>
  )
}

export function ThreeScene({
  variant,
  className,
}: {
  variant: SceneVariant
  className?: string
}) {
  const reduced = useReducedMotion()

  return (
    <div className={cn('pointer-events-none h-full w-full', className)} aria-hidden>
      <Canvas camera={{ position: [0, 0, 5.2], fov: 45 }} dpr={[1, 1.5]}>
        <SceneContent variant={variant} reduced={reduced} />
        {!reduced && variant === 'landing' && <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.4} />}
      </Canvas>
    </div>
  )
}
