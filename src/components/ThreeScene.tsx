import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useMemo, useRef } from 'react'
import {
  CatmullRomCurve3,
  ExtrudeGeometry,
  Shape,
  TubeGeometry,
  Vector3,
  type Group,
  type Mesh,
} from 'three'
import { useReducedMotion } from '../hooks/useMedia'
import { cn } from '../utils'

export type SceneVariant = 'landing' | 'auth' | 'dashboard' | '404'

const HEART_RED = '#e11d48'
const ECG_GLOW = '#a5f3fc'

function createHeartGeometry() {
  const shape = new Shape()
  shape.moveTo(0, -1.28)
  shape.bezierCurveTo(-0.18, -0.95, -1.38, -0.38, -1.13, 0.42)
  shape.bezierCurveTo(-0.98, 0.98, -0.3, 1.3, 0, 0.76)
  shape.bezierCurveTo(0.3, 1.3, 0.98, 0.98, 1.13, 0.42)
  shape.bezierCurveTo(1.38, -0.38, 0.18, -0.95, 0, -1.28)

  return new ExtrudeGeometry(shape, {
    depth: 0.42,
    bevelEnabled: true,
    bevelSegments: 5,
    bevelSize: 0.09,
    bevelThickness: 0.1,
    curveSegments: 40,
  })
}

function curveGeometry(points: [number, number, number][], radius: number, tubularSegments = 96) {
  return new TubeGeometry(
    new CatmullRomCurve3(points.map(([x, y, z]) => new Vector3(x, y, z))),
    tubularSegments,
    radius,
    10,
    false,
  )
}

function ECGTrace({ reduced }: { reduced: boolean }) {
  const group = useRef<Group>(null)
  const cursor = useRef<Mesh>(null)
  const curve = useMemo(
    () =>
      new CatmullRomCurve3([
        new Vector3(-0.98, 0.03, 0.58),
        new Vector3(-0.72, 0.03, 0.58),
        new Vector3(-0.58, 0.16, 0.58),
        new Vector3(-0.42, 0.03, 0.58),
        new Vector3(-0.23, 0.03, 0.58),
        new Vector3(-0.12, -0.17, 0.58),
        new Vector3(0.02, 0.68, 0.58),
        new Vector3(0.15, -0.26, 0.58),
        new Vector3(0.3, 0.03, 0.58),
        new Vector3(0.52, 0.23, 0.58),
        new Vector3(0.76, 0.03, 0.58),
        new Vector3(1.02, 0.03, 0.58),
      ]),
    [],
  )
  const geometry = useMemo(() => new TubeGeometry(curve, 160, 0.026, 10, false), [curve])

  useFrame(({ clock }) => {
    if (reduced || !cursor.current) return
    cursor.current.position.copy(curve.getPointAt((clock.elapsedTime * 0.42) % 1))
    if (group.current) group.current.rotation.z = Math.sin(clock.elapsedTime * 1.6) * 0.01
  })

  return (
    <group ref={group}>
      <mesh geometry={geometry}>
        <meshBasicMaterial color={ECG_GLOW} toneMapped={false} />
      </mesh>
      <mesh ref={cursor} position={curve.getPointAt(0)}>
        <sphereGeometry args={[0.065, 16, 16]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
    </group>
  )
}

function Stethoscope() {
  const rubberTube = useMemo(
    () => curveGeometry([[-1.08, -0.42, 0.35], [-1.3, -1.08, 0.34], [-0.83, -1.62, 0.34], [0.02, -1.78, 0.34], [0.92, -1.5, 0.34], [1.18, -0.83, 0.34], [0.98, -0.48, 0.34]], 0.075),
    [],
  )
  const leftEarTube = useMemo(() => curveGeometry([[-0.5, 0.75, -0.13], [-0.95, 1.34, -0.2], [-1.18, 1.55, -0.2]], 0.035, 48), [])
  const rightEarTube = useMemo(() => curveGeometry([[0.5, 0.75, -0.13], [0.95, 1.34, -0.2], [1.18, 1.55, -0.2]], 0.035, 48), [])

  return (
    <group>
      <mesh geometry={rubberTube} castShadow>
        <meshStandardMaterial color="#0f172a" roughness={0.34} metalness={0.08} />
      </mesh>
      <mesh position={[-1.1, -0.38, 0.48]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.2, 0.09, 36]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.22} metalness={0.88} />
      </mesh>
      <mesh position={[-1.1, -0.38, 0.535]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.13, 0.13, 0.015, 32]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.3} metalness={0.55} />
      </mesh>
      <mesh geometry={leftEarTube}><meshStandardMaterial color="#94a3b8" roughness={0.22} metalness={0.9} /></mesh>
      <mesh geometry={rightEarTube}><meshStandardMaterial color="#94a3b8" roughness={0.22} metalness={0.9} /></mesh>
      {[-1.2, 1.2].map((x) => (
        <mesh key={x} position={[x, 1.56, -0.2]} rotation={[0, 0, x * 0.25]}>
          <capsuleGeometry args={[0.055, 0.16, 8, 16]} />
          <meshStandardMaterial color="#0f172a" roughness={0.48} />
        </mesh>
      ))}
    </group>
  )
}

function HeartScene({ reduced, variant }: { reduced: boolean; variant: SceneVariant }) {
  const heart = useRef<Group>(null)
  const geometry = useMemo(createHeartGeometry, [])
  const scale = variant === 'dashboard' ? 0.82 : variant === 'auth' ? 0.9 : 1

  useFrame(({ clock }) => {
    if (!heart.current || reduced) return
    const time = clock.elapsedTime
    const phase = time % 0.9
    const firstBeat = Math.exp(-Math.pow((phase - 0.12) / 0.055, 2))
    const secondBeat = Math.exp(-Math.pow((phase - 0.31) / 0.07, 2)) * 0.62
    heart.current.scale.setScalar(scale * (1 + (firstBeat + secondBeat) * 0.075))
    heart.current.position.y = Math.sin(time * 1.35) * 0.09
    heart.current.rotation.y = Math.sin(time * 0.65) * 0.14
    heart.current.rotation.x = Math.sin(time * 0.8) * 0.035
  })

  return (
    <group ref={heart} scale={scale} rotation={[0.02, -0.12, 0]}>
      <mesh geometry={geometry} position={[0, 0, -0.2]} castShadow receiveShadow>
        <meshPhysicalMaterial color={HEART_RED} roughness={0.25} metalness={0.1} clearcoat={0.6} clearcoatRoughness={0.16} />
      </mesh>
      <ECGTrace reduced={reduced} />
      <Stethoscope />
    </group>
  )
}

function SceneContent({ variant, reduced }: { variant: SceneVariant; reduced: boolean }) {
  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight castShadow position={[3.5, 4.5, 4]} intensity={1.5} shadow-mapSize={[1024, 1024]} />
      <pointLight position={[-1.5, 0.4, 3]} color="#fda4af" intensity={1.15} distance={5} />
      <HeartScene variant={variant} reduced={reduced} />
    </>
  )
}

export function ThreeScene({ variant, className }: { variant: SceneVariant; className?: string }) {
  const reduced = useReducedMotion()
  const interactive = variant === 'landing' && !reduced

  return (
    <div className={cn(interactive ? 'pointer-events-auto h-full w-full' : 'pointer-events-none h-full w-full', className)} aria-hidden>
      <Canvas shadows camera={{ position: [0, 0, 5], fov: 45 }} dpr={[1, 1.5]} gl={{ alpha: true, antialias: true }}>
        <SceneContent variant={variant} reduced={reduced} />
        {interactive && <OrbitControls enablePan={false} enableZoom enableDamping dampingFactor={0.07} minDistance={3.5} maxDistance={7} />}
      </Canvas>
    </div>
  )
}
