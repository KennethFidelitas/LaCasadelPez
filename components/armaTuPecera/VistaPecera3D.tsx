'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import {
  Environment,
  OrbitControls,
  RoundedBox,
  Image,
  Billboard,
} from '@react-three/drei'
import { Suspense, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { PECERAS, FILTROS, PECES } from './data'
import type { WaterType } from './types'

interface Props {
  waterType: WaterType | null
  peceraId: string | null
  filtroId: string | null
  fishQuantities: Record<string, number>
}

interface PezEscena {
  id: string
  instance: number
  color: string
  image?: string
  position: [number, number, number]
  speed: number
  direction: number
}

export function VistaPecera3D({
  waterType,
  peceraId,
  filtroId,
  fishQuantities,
}: Props) {
  const pecera = PECERAS.find(item => item.id === peceraId) ?? null
  const filtro = FILTROS.find(item => item.id === filtroId) ?? null

  const peces = useMemo<PezEscena[]>(() => {
    const resultado: PezEscena[] = []

    Object.entries(fishQuantities).forEach(([fishId, cantidad]) => {
      const pez = PECES.find(item => item.id === fishId)
      if (!pez) return

      for (let index = 0; index < cantidad; index += 1) {
        resultado.push({
          id: pez.id,
          instance: index,
          color: obtenerColorPez(pez.id),
          image: pez.image,
          position: [
          -1.3 + Math.random() * 2.6,
          -0.35 + Math.random() * 1.15,
          0.65,
        ],
          speed: 0.4 + Math.random() * 0.3,
          direction: Math.random() > 0.5 ? 1 : -1,
        })
      }
    })

    return resultado
  }, [fishQuantities])

  if (!pecera) {
    return (
      <div className="rounded-xl border border-border bg-background p-8 text-center text-sm text-muted-foreground">
        Selecciona una pecera para activar la vista 3D.
      </div>
    )
  }

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-slate-950">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-white">
        <div>
          <h3 className="text-sm font-semibold">Vista 3D de tu pecera</h3>
          <p className="text-xs text-slate-400">
            Arrastra para girar y usa la rueda para acercar.
          </p>
        </div>

        <span className="rounded-full bg-white/10 px-3 py-1 text-xs">
          {pecera.litros} L
        </span>
      </div>

      <div className="h-[480px] w-full">
        <Canvas
          camera={{
            position: [0, 2.4, 8],
            fov: 45,
          }}
          shadows
        >
          <Suspense fallback={null}>
            <color attach="background" args={['#071827']} />

            <ambientLight intensity={1.4} />
            <directionalLight
              position={[4, 7, 4]}
              intensity={2}
              castShadow
            />
            <pointLight
              position={[-4, 3, 2]}
              intensity={10}
              color="#8be9ff"
            />

            <Acuario
              waterType={waterType}
              mostrarFiltro={Boolean(filtro)}
              escala={obtenerEscalaPecera(pecera.litros)}
            />

            {peces.map(pez => (
              <PezAnimado
                key={`${pez.id}-${pez.instance}`}
                {...pez}
              />
            ))}

            <Environment preset="warehouse" />

            <OrbitControls
              enablePan={false}
              minDistance={5}
              maxDistance={11}
              minPolarAngle={Math.PI / 4}
              maxPolarAngle={Math.PI / 2.05}
            />
          </Suspense>
        </Canvas>
      </div>
    </section>
  )
}

function Acuario({
  waterType,
  mostrarFiltro,
  escala,
}: {
  waterType: WaterType | null
  mostrarFiltro: boolean
  escala: number
}) {
  const waterColor = waterType === 'salada'
    ? '#168bcc'
    : '#4ba58c'

  return (
    <group scale={[escala, escala, escala]}>
      {/* Agua */}
      <RoundedBox
        args={[6, 3.6, 3]}
        radius={0.12}
        smoothness={4}
        position={[0, 0.4, 0]}
      >
        <meshPhysicalMaterial
          color={waterColor}
          transparent
          opacity={0.34}
          transmission={0.35}
          roughness={0.15}
          thickness={0.5}
        />
      </RoundedBox>

      {/* Base */}
      <mesh position={[0, -1.25, 0]} receiveShadow>
        <boxGeometry args={[5.85, 0.28, 2.85]} />
        <meshStandardMaterial color="#8b6c42" roughness={1} />
      </mesh>

      {/* Piedras */}
      {Array.from({ length: 18 }).map((_, index) => (
        <mesh
          key={index}
          position={[
            -2.5 + (index % 6),
            -1.02,
            -1 + Math.floor(index / 6),
          ]}
          scale={[
            0.2 + (index % 3) * 0.08,
            0.12,
            0.18,
          ]}
          castShadow
        >
          <sphereGeometry args={[1, 12, 12]} />
          <meshStandardMaterial
            color={index % 2 === 0 ? '#6b7280' : '#a78b6d'}
          />
        </mesh>
      ))}

      {/* Plantas */}
        <Planta position={[-2.1, -1.08, -1.15]} height={1.5} />
        <Planta position={[-1.25, -1.08, -1.2]} height={1.15} />
        <Planta position={[1.55, -1.08, -1.2]} height={1.35} />
        <Planta position={[2.1, -1.08, -1.15]} height={1.05} />

      {/* Filtro */}
      {mostrarFiltro && (
        <group position={[2.55, 0.05, -1.1]}>
          <mesh castShadow>
            <boxGeometry args={[0.35, 1.7, 0.45]} />
            <meshStandardMaterial color="#111827" />
          </mesh>

          <mesh position={[-0.25, 0.65, 0]}>
            <boxGeometry args={[0.55, 0.15, 0.15]} />
            <meshStandardMaterial color="#374151" />
          </mesh>
        </group>
      )}
    </group>
  )
}

function Planta({
  position,
  height,
}: {
  position: [number, number, number]
  height: number
}) {
  const ref = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (!ref.current) return

    ref.current.rotation.z =
      Math.sin(clock.elapsedTime * 1.1 + position[0]) * 0.04
  })

  return (
    <group ref={ref} position={position}>
      {[-0.18, 0, 0.18].map((offset, index) => (
        <mesh
          key={index}
          position={[offset, height / 2, 0]}
          rotation={[0, 0, offset * 0.45]}
        >
          <planeGeometry args={[0.22, height]} />

          <meshStandardMaterial
            color={index === 1 ? '#16a34a' : '#22c55e'}
            side={THREE.DoubleSide}
            transparent
            opacity={0.95}
          />
        </mesh>
      ))}
    </group>
  )
}

function PezAnimado({
  position,
  color,
  speed,
  image,
}: PezEscena) {
  const ref = useRef<THREE.Group>(null)
  const initialX = position[0]

  useFrame(({ clock }) => {
    if (!ref.current) return

    const tiempo = clock.elapsedTime * speed + initialX
    const movement = Math.sin(tiempo) * 0.8

    ref.current.position.x = THREE.MathUtils.clamp(
      initialX + movement,
      -1.55,
      1.55
    )

    ref.current.position.y = THREE.MathUtils.clamp(
      position[1] +
        Math.sin(clock.elapsedTime + initialX) * 0.08,
      -0.45,
      0.95
    )
  })

  return (
    <group
      ref={ref}
      position={[position[0], position[1], 0.7]}
    >
      {image ? (
        <Billboard follow>
          <Image
            url={`/${image}`}
            scale={[1.2, 0.8]}
            transparent
            toneMapped={false}
          />
        </Billboard>
      ) : (
        <group scale={0.35}>
          <mesh scale={[1.3, 0.75, 0.48]}>
            <sphereGeometry args={[1, 24, 24]} />
            <meshStandardMaterial color={color} />
          </mesh>

          <mesh
            position={[-1.25, 0, 0]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <coneGeometry args={[0.7, 1.1, 3]} />
            <meshStandardMaterial color={color} />
          </mesh>
        </group>
      )}
    </group>
  )
}

function obtenerEscalaPecera(litros: number) {
  if (litros <= 20) return 0.75
  if (litros <= 60) return 0.88
  if (litros <= 120) return 1
  if (litros <= 200) return 1.08
  return 1.16
}

function obtenerColorPez(id: string) {
  const colores: Record<string, string> = {
    betta: '#2563eb',
    'neon-tetra': '#38bdf8',
    guppy: '#f97316',
    goldfish: '#f59e0b',
    angel: '#cbd5e1',
    pleco: '#57534e',
    corydoras: '#d6d3d1',
    oscar: '#ea580c',
    clownfish: '#fb6a22',
    damsel: '#1d4ed8',
    'marine-angel': '#facc15',
    tang: '#2563eb',
    'neon-goby': '#22d3ee',
    mandarin: '#a855f7',
    lionfish: '#dc2626',
    chromis: '#10b981',
  }

  return colores[id] ?? '#e2e8f0'
}