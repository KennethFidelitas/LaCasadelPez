'use client'

import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Edges, OrbitControls, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { FILTROS, ILUMINACIONES, PECERAS, PECERAS_PREDISENO, PECES } from './data'
import type { WaterType } from './types'

interface Props {
  waterType: WaterType | null
  peceraId: string | null
  filtroId: string | null
  iluminacionId: string | null
  accesoriosSeleccionados: Record<string, boolean>
  fishQuantities: Record<string, number>
}

interface FishInstance {
  key: string
  name: string
  image?: string
  start: [number, number, number]
  speed: number
  scale: number
  phase: number
}

export function VistaPecera3D({
  waterType,
  peceraId,
  filtroId,
  iluminacionId,
  accesoriosSeleccionados,
  fishQuantities,
}: Props) {
  const pecera = useMemo(
    () => [...PECERAS, ...PECERAS_PREDISENO].find(item => item.id === peceraId) ?? null,
    [peceraId],
  )
  const filtro = FILTROS.find(item => item.id === filtroId) ?? null
  const iluminacion = ILUMINACIONES.find(item => item.id === iluminacionId) ?? null
  const prediseno = PECERAS_PREDISENO.find(item => item.id === peceraId) ?? null

  const dimensiones = useMemo(() => parseDimensions(pecera?.dimensions), [pecera?.dimensions])
  const fish = useMemo(() => createFishInstances(fishQuantities), [fishQuantities])
  const hasSubstrate = Boolean(
    accesoriosSeleccionados['sustrato-planted'] ||
    accesoriosSeleccionados['sustrato-marino'] ||
    prediseno?.incluye.some(item => item.toLowerCase().includes('sustrato') || item.toLowerCase().includes('arena')),
  )
  const hasPlants = Boolean(
    accesoriosSeleccionados['co2-kit'] ||
    accesoriosSeleccionados['sustrato-planted'] ||
    prediseno?.id === 'planted-tank',
  )
  const hasHeater = Boolean(
    accesoriosSeleccionados.calentador ||
    accesoriosSeleccionados['calentador-xl'] ||
    prediseno?.incluye.some(item => item.toLowerCase().includes('calentador')),
  )
  const hasLid = Boolean(
    accesoriosSeleccionados.tapa ||
    prediseno?.incluye.some(item => item.toLowerCase().includes('tapa')),
  )
  const hasFilter = Boolean(filtro || prediseno)
  const hasCo2 = Boolean(accesoriosSeleccionados['co2-kit'] || prediseno?.incluye.some(item => item.includes('CO₂')))
  const hasThermometer = Boolean(accesoriosSeleccionados.termometro || prediseno?.incluye.some(item => item.toLowerCase().includes('termómetro')))
  const hasNet = Boolean(accesoriosSeleccionados['red-peces'])
  const hasSiphon = Boolean(accesoriosSeleccionados.sifon)
  const hasOsmosis = Boolean(accesoriosSeleccionados.osmoinstalada)
  const substrateType = accesoriosSeleccionados['sustrato-marino']
    ? 'marino'
    : accesoriosSeleccionados['sustrato-planted'] || prediseno?.id === 'planted-tank'
      ? 'plantado'
      : 'natural'

  if (!pecera) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-gradient-to-br from-sky-950 to-slate-950 p-10 text-center">
        <div className="mx-auto mb-4 h-16 w-24 rounded border border-cyan-200/40 bg-cyan-400/10 shadow-lg shadow-cyan-500/10" />
        <p className="text-sm font-medium text-white">Selecciona una pecera para activar la vista 3D.</p>
        <p className="mt-1 text-xs text-slate-400">Podrás girarla, acercarla y verla cambiar con cada opción.</p>
      </div>
    )
  }

  const lightColor = iluminacion?.id === 'luz-reef'
    ? '#69bfff'
    : iluminacion?.id === 'luz-planted'
      ? '#fff0b8'
      : '#d9f6ff'

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-slate-950 text-white shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold">Vista 3D de tu pecera</h3>
          <p className="text-xs text-slate-400">Arrastra para girar · rueda para acercar · doble clic para restablecer</p>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="rounded-full bg-white/10 px-3 py-1">{pecera.litros} L</span>
          <span className="rounded-full bg-cyan-400/15 px-3 py-1 text-cyan-100">{pecera.dimensions}</span>
        </div>
      </div>

      <div className="relative h-[430px] w-full bg-[radial-gradient(circle_at_top,#12385a,#030712_68%)]">
        <Canvas
          camera={{ position: [5.5, 3.2, 6], fov: 36 }}
          dpr={[1, 1.75]}
          gl={{ antialias: true, alpha: true }}
        >
          <Suspense fallback={null}>
            <ambientLight intensity={0.75} />
            <directionalLight position={[4, 7, 5]} intensity={1.5} color={lightColor} />
            {iluminacion && (
              <pointLight position={[0, dimensiones.height / 2 + 0.6, 0]} intensity={18} distance={9} color={lightColor} />
            )}
            <AquariumScene
              dimensions={dimensiones}
              waterType={waterType}
              lightColor={lightColor}
              hasLight={Boolean(iluminacion || prediseno)}
              hasFilter={hasFilter}
              hasSubstrate={hasSubstrate}
              hasPlants={hasPlants}
              hasHeater={hasHeater}
              hasLid={hasLid}
              hasCo2={hasCo2}
              hasThermometer={hasThermometer}
              hasNet={hasNet}
              hasSiphon={hasSiphon}
              hasOsmosis={hasOsmosis}
              substrateType={substrateType}
              fish={fish}
            />
            <OrbitControls
              makeDefault
              enablePan={false}
              minDistance={4}
              maxDistance={11}
              minPolarAngle={Math.PI / 5}
              maxPolarAngle={Math.PI / 2.05}
              target={[0, 0, 0]}
            />
          </Suspense>
        </Canvas>

        <div className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap gap-2 text-[11px] text-slate-200">
          <span className="rounded-full bg-black/45 px-2.5 py-1 backdrop-blur">{waterType === 'salada' ? 'Agua salada' : 'Agua dulce'}</span>
          {hasFilter && <span className="rounded-full bg-black/45 px-2.5 py-1 backdrop-blur">Filtro</span>}
          {(iluminacion || prediseno) && <span className="rounded-full bg-black/45 px-2.5 py-1 backdrop-blur">Iluminación</span>}
          {fish.length > 0 && <span className="rounded-full bg-black/45 px-2.5 py-1 backdrop-blur">{fish.length} peces</span>}
        </div>
      </div>
    </section>
  )
}

function AquariumScene({
  dimensions,
  waterType,
  lightColor,
  hasLight,
  hasFilter,
  hasSubstrate,
  hasPlants,
  hasHeater,
  hasLid,
  hasCo2,
  hasThermometer,
  hasNet,
  hasSiphon,
  hasOsmosis,
  substrateType,
  fish,
}: {
  dimensions: SceneDimensions
  waterType: WaterType | null
  lightColor: string
  hasLight: boolean
  hasFilter: boolean
  hasSubstrate: boolean
  hasPlants: boolean
  hasHeater: boolean
  hasLid: boolean
  hasCo2: boolean
  hasThermometer: boolean
  hasNet: boolean
  hasSiphon: boolean
  hasOsmosis: boolean
  substrateType: 'marino' | 'plantado' | 'natural'
  fish: FishInstance[]
}) {
  const { width, height, depth } = dimensions
  const waterColor = waterType === 'salada' ? '#168bd2' : '#18a6a0'

  return (
    <group position={[0, -0.15, 0]}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[width, height, depth]} />
        <meshPhysicalMaterial color="#d9fbff" transparent opacity={0.075} roughness={0.08} transmission={0.65} side={THREE.DoubleSide} />
        <Edges color="#b9f3ff" threshold={15} />
      </mesh>

      <mesh position={[0, -0.08, 0]}>
        <boxGeometry args={[width - 0.13, height - 0.24, depth - 0.13]} />
        <meshPhysicalMaterial color={waterColor} transparent opacity={0.24} roughness={0.18} transmission={0.28} depthWrite={false} />
      </mesh>

      <mesh position={[0, -height / 2 + 0.09, 0]}>
        <boxGeometry args={[width - 0.12, hasSubstrate ? 0.25 : 0.1, depth - 0.12]} />
        <meshStandardMaterial
          color={substrateType === 'marino' ? '#eee0bd' : substrateType === 'plantado' ? '#493225' : '#c9b98b'}
          roughness={1}
        />
      </mesh>

      {hasSubstrate && <SubstrateDetails width={width} height={height} depth={depth} type={substrateType} />}

      {hasLight && (
        <group position={[0, height / 2 + 0.22, 0]}>
          <mesh>
            <boxGeometry args={[width * 0.72, 0.12, 0.2]} />
            <meshStandardMaterial color="#202936" metalness={0.7} roughness={0.25} />
          </mesh>
          <mesh position={[0, -0.07, 0]}>
            <boxGeometry args={[width * 0.63, 0.035, 0.12]} />
            <meshBasicMaterial color={lightColor} toneMapped={false} />
          </mesh>
        </group>
      )}

      {hasLid && (
        <mesh position={[0, height / 2 + 0.045, 0]}>
          <boxGeometry args={[width + 0.08, 0.07, depth + 0.08]} />
          <meshPhysicalMaterial color="#a9dce5" transparent opacity={0.28} roughness={0.12} transmission={0.5} />
        </mesh>
      )}

      {hasFilter && <Filter width={width} height={height} depth={depth} />}
      {hasHeater && <Heater width={width} height={height} depth={depth} />}
      {hasCo2 && <Co2System width={width} height={height} depth={depth} />}
      {hasThermometer && <Thermometer width={width} height={height} depth={depth} />}
      {hasNet && <FishNet width={width} height={height} depth={depth} />}
      {hasSiphon && <Siphon width={width} height={height} depth={depth} />}
      {hasOsmosis && <OsmosisUnit width={width} height={height} depth={depth} />}
      {hasPlants && <Plants width={width} height={height} depth={depth} />}
      {!hasPlants && <Rocks height={height} />}

      {fish.map(item => (
        <AnimatedFish key={item.key} fish={item} bounds={{ width, height, depth }} />
      ))}
    </group>
  )
}

function AnimatedFish({ fish, bounds }: { fish: FishInstance; bounds: SceneDimensions }) {
  const ref = useRef<THREE.Sprite>(null)
  const texture = useTexture(fish.image ? `/${encodeURIComponent(fish.image)}` : '/placeholder.svg')

  useMemo(() => {
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 4
    texture.needsUpdate = true
  }, [texture])

  useFrame(({ clock }) => {
    if (!ref.current) return
    const time = clock.elapsedTime * fish.speed + fish.phase
    const horizontalLimit = Math.max(0.45, bounds.width / 2 - 0.48 * fish.scale)
    const verticalLimit = Math.max(0.3, bounds.height / 2 - 0.42 * fish.scale)
    const depthLimit = Math.max(0.12, bounds.depth / 2 - 0.14)
    const x = Math.sin(time) * horizontalLimit * 0.9
    const y = THREE.MathUtils.clamp(fish.start[1] * verticalLimit + Math.sin(time * 2.1) * 0.06, -verticalLimit, verticalLimit)
    const z = THREE.MathUtils.clamp(fish.start[2] * depthLimit, -depthLimit, depthLimit)
    ref.current.position.set(x, y, z)
    ref.current.scale.set(0.82 * fish.scale, 0.58 * fish.scale, 1)
  })

  return (
    <sprite ref={ref} name={fish.name} renderOrder={100}>
      <spriteMaterial
        map={texture}
        transparent
        alphaTest={0.08}
        depthTest={false}
        depthWrite={false}
        toneMapped={false}
      />
    </sprite>
  )
}

function Filter({ width, height, depth }: SceneDimensions) {
  return (
    <group position={[width / 2 - 0.27, height * 0.05, -depth / 2 + 0.23]}>
      <mesh>
        <boxGeometry args={[0.28, height * 0.58, 0.3]} />
        <meshStandardMaterial color="#172033" metalness={0.35} roughness={0.5} />
      </mesh>
      {[0, 1, 2, 3].map(index => (
        <mesh key={index} position={[-0.18, 0.1 + index * 0.28, 0]}>
          <sphereGeometry args={[0.035 + index * 0.012, 10, 8]} />
          <meshBasicMaterial color="#d8fbff" transparent opacity={0.7} />
        </mesh>
      ))}
    </group>
  )
}

function Heater({ width, height, depth }: SceneDimensions) {
  return (
    <group position={[-width / 2 + 0.22, 0, -depth / 2 + 0.18]}>
      <mesh>
        <cylinderGeometry args={[0.055, 0.055, height * 0.62, 14]} />
        <meshStandardMaterial color="#273244" metalness={0.7} roughness={0.25} />
      </mesh>
      <mesh position={[0, -height * 0.2, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.2, 14]} />
        <meshBasicMaterial color="#ff6b35" />
      </mesh>
    </group>
  )
}

function SubstrateDetails({ width, height, depth, type }: SceneDimensions & { type: 'marino' | 'plantado' | 'natural' }) {
  const color = type === 'marino' ? '#f8edcf' : type === 'plantado' ? '#2f211a' : '#a99068'
  return (
    <group position={[0, -height / 2 + 0.23, 0]}>
      {Array.from({ length: 28 }, (_, index) => {
        const x = -width * 0.45 + ((index * 37) % 90) / 100 * width
        const z = -depth * 0.4 + ((index * 53) % 80) / 100 * depth
        const size = 0.025 + (index % 4) * 0.012
        return (
          <mesh key={index} position={[x, (index % 3) * 0.018, z]}>
            <dodecahedronGeometry args={[size, 0]} />
            <meshStandardMaterial color={index % 3 === 0 ? '#d8c69d' : color} roughness={1} />
          </mesh>
        )
      })}
    </group>
  )
}

function Co2System({ width, height, depth }: SceneDimensions) {
  return (
    <group position={[-width / 2 + 0.34, -height / 2 + 0.48, depth / 2 - 0.22]}>
      <mesh>
        <cylinderGeometry args={[0.13, 0.15, 0.7, 18]} />
        <meshStandardMaterial color="#d9e1e8" metalness={0.85} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.15, 14]} />
        <meshStandardMaterial color="#263241" metalness={0.7} />
      </mesh>
      <mesh position={[0.1, 0.48, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.07, 0.018, 8, 16]} />
        <meshStandardMaterial color="#f1f5f9" metalness={0.9} />
      </mesh>
      <mesh position={[0.2, 0.3, 0]} rotation={[0, 0, -0.2]}>
        <cylinderGeometry args={[0.012, 0.012, 0.55, 8]} />
        <meshStandardMaterial color="#d7f9ff" transparent opacity={0.65} />
      </mesh>
    </group>
  )
}

function Thermometer({ width, height, depth }: SceneDimensions) {
  return (
    <group position={[width / 2 + 0.025, height * 0.12, depth * 0.12]} rotation={[0, -Math.PI / 2, 0]}>
      <mesh>
        <boxGeometry args={[0.4, 0.25, 0.07]} />
        <meshStandardMaterial color="#e6edf3" roughness={0.32} />
      </mesh>
      <mesh position={[0, 0, 0.042]}>
        <planeGeometry args={[0.25, 0.12]} />
        <meshBasicMaterial color="#60d6e8" />
      </mesh>
      <mesh position={[0, -0.44, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 0.65, 8]} />
        <meshStandardMaterial color="#323e4c" />
      </mesh>
    </group>
  )
}

function FishNet({ width, height, depth }: SceneDimensions) {
  return (
    <group position={[width * 0.28, 0.15, -depth / 2 + 0.12]} rotation={[0, 0, -0.3]}>
      <mesh position={[0, -0.45, 0]}>
        <cylinderGeometry args={[0.025, 0.025, height * 0.72, 10]} />
        <meshStandardMaterial color="#e87931" roughness={0.6} />
      </mesh>
      <mesh position={[0, height * 0.08, 0]}>
        <torusGeometry args={[0.28, 0.025, 10, 28]} />
        <meshStandardMaterial color="#d8e4e8" metalness={0.5} />
      </mesh>
      <mesh position={[0, height * 0.08, 0.005]}>
        <circleGeometry args={[0.255, 24]} />
        <meshBasicMaterial color="#9bd6e1" transparent opacity={0.18} wireframe />
      </mesh>
    </group>
  )
}

function Siphon({ width, height, depth }: SceneDimensions) {
  return (
    <group position={[-width * 0.22, 0, depth / 2 - 0.12]}>
      <mesh position={[0, -height * 0.12, 0]}>
        <cylinderGeometry args={[0.055, 0.1, height * 0.48, 14]} />
        <meshPhysicalMaterial color="#bdeefa" transparent opacity={0.42} transmission={0.5} roughness={0.2} />
      </mesh>
      <mesh position={[0.18, height * 0.18, 0]} rotation={[0, 0, -0.48]}>
        <torusGeometry args={[0.33, 0.025, 10, 30, Math.PI * 1.2]} />
        <meshStandardMaterial color="#d7f4f8" transparent opacity={0.7} />
      </mesh>
    </group>
  )
}

function OsmosisUnit({ width, height, depth }: SceneDimensions) {
  return (
    <group position={[-width / 2 + 0.28, height * 0.18, -depth / 2 + 0.22]}>
      {[0, 1, 2].map(index => (
        <mesh key={index} position={[index * 0.13, 0, 0]}>
          <cylinderGeometry args={[0.065, 0.065, height * 0.48, 14]} />
          <meshStandardMaterial color={index === 1 ? '#cbd5e1' : '#eff6ff'} metalness={0.2} roughness={0.25} />
        </mesh>
      ))}
      <mesh position={[0.13, height * 0.29, 0]}>
        <boxGeometry args={[0.48, 0.12, 0.18]} />
        <meshStandardMaterial color="#1f4c70" metalness={0.35} />
      </mesh>
    </group>
  )
}

function Plants({ width, height, depth }: SceneDimensions) {
  const positions = [
    [-width * 0.34, -height / 2 + 0.18, -depth * 0.22],
    [-width * 0.18, -height / 2 + 0.18, depth * 0.2],
    [width * 0.28, -height / 2 + 0.18, depth * 0.12],
  ] as const

  return (
    <>
      {positions.map((position, groupIndex) => (
        <group key={groupIndex} position={position}>
          {[0, 1, 2].map(index => (
            <mesh key={index} position={[(index - 1) * 0.12, height * (0.11 + index * 0.035), 0]} rotation={[0, 0, (index - 1) * 0.17]}>
              <capsuleGeometry args={[0.045, height * (0.18 + index * 0.05), 4, 8]} />
              <meshStandardMaterial color={index === 1 ? '#2fc76d' : '#55df83'} roughness={0.75} />
            </mesh>
          ))}
        </group>
      ))}
    </>
  )
}

function Rocks({ height }: { height: number }) {
  return (
    <group position={[0, -height / 2 + 0.16, 0]}>
      <mesh position={[-0.3, 0.12, 0]} rotation={[0.2, 0.3, 0]} scale={[1.4, 0.75, 1]}>
        <dodecahedronGeometry args={[0.28, 0]} />
        <meshStandardMaterial color="#64748b" roughness={0.95} />
      </mesh>
      <mesh position={[0.26, 0.09, 0.08]} scale={[1, 0.62, 0.8]}>
        <dodecahedronGeometry args={[0.24, 0]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.95} />
      </mesh>
    </group>
  )
}

interface SceneDimensions {
  width: number
  height: number
  depth: number
}

function parseDimensions(value?: string): SceneDimensions {
  const numbers = value?.match(/\d+(?:\.\d+)?/g)?.map(Number) ?? [60, 35, 35]
  const [length = 60, depthValue = 35, heightValue = 35] = numbers
  const longest = Math.max(length, depthValue, heightValue)
  const scale = 4.8 / longest
  return {
    width: Math.max(2.7, length * scale),
    depth: Math.max(1.45, depthValue * scale),
    height: Math.max(2.1, heightValue * scale),
  }
}

function createFishInstances(quantities: Record<string, number>): FishInstance[] {
  const result: FishInstance[] = []
  Object.entries(quantities).forEach(([fishId, quantity]) => {
    const fish = PECES.find(item => item.id === fishId)
    if (!fish) return
    for (let index = 0; index < quantity; index += 1) {
      const seed = hash(`${fishId}-${index}`)
      result.push({
        key: `${fishId}-${index}`,
        name: fish.name,
        image: fish.image,
        start: [0, -0.78 + ((seed >> 3) % 17) / 10, -0.85 + ((seed >> 5) % 18) / 10],
        speed: 0.38 + (seed % 5) * 0.055,
        scale: 0.72 + (seed % 4) * 0.08,
        phase: (seed % 628) / 100,
      })
    }
  })
  return result.slice(0, 32)
}

function hash(value: string) {
  return [...value].reduce((total, character) => ((total << 5) - total + character.charCodeAt(0)) | 0, 0) >>> 0
}
