'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Interactive WebGL scene made only from primitives (no model/texture
 * downloads, so it adds zero network weight beyond the JS chunk).
 * variant="hero"  → full arcade playground (gamepad, dice, VR gem, joystick, rings)
 * variant="stage" → quieter orbit rings + particles, used behind product images
 */

const ORANGE = '#fb923c';
const VIOLET = '#8b5cf6';
const BLUE = '#3b82f6';
const CYAN = '#22d3ee';
const PINK = '#f472b6';

type Pointer = { x: number; y: number };

function Particles({ count = 600, radius = 9 }: { count?: number; radius?: number }) {
  const ref = useRef<THREE.Points>(null!);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = radius * (0.35 + Math.random() * 0.65);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, [count, radius]);

  useFrame((_, dt) => {
    ref.current.rotation.y += dt * 0.025;
    ref.current.rotation.x += dt * 0.008;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.035} color="#c7d2fe" transparent opacity={0.75} sizeAttenuation depthWrite={false} />
    </points>
  );
}

/** Bobbing, spinning object. With `href` it becomes a labelled, clickable link. */
function Floaty({
  children,
  position,
  speed = 1,
  spin = [0.2, 0.35, 0],
  amp = 0.25,
  scale = 1,
  href,
  label,
}: {
  children: React.ReactNode;
  position: [number, number, number];
  speed?: number;
  spin?: [number, number, number];
  amp?: number;
  scale?: number;
  href?: string;
  label?: string;
}) {
  const outer = useRef<THREE.Group>(null!);
  const inner = useRef<THREE.Group>(null!);
  const hover = useRef(0);
  const target = useRef(0);
  const [hot, setHot] = useState(false);
  const router = useRouter();
  const offset = useMemo(() => Math.random() * 100, []);

  useEffect(() => () => void (document.body.style.cursor = ''), []);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime * speed + offset;
    outer.current.position.y = position[1] + Math.sin(t) * amp;
    hover.current = THREE.MathUtils.lerp(hover.current, target.current, 0.08);
    const boost = 1 + hover.current * 5;
    inner.current.rotation.x += dt * spin[0] * boost;
    inner.current.rotation.y += dt * spin[1] * boost;
    inner.current.rotation.z += dt * spin[2] * boost;
    outer.current.scale.setScalar(scale * (1 + hover.current * 0.22));
  });

  const interactive = !!href;

  return (
    <group
      ref={outer}
      position={position}
      scale={scale}
      onPointerOver={(e) => {
        e.stopPropagation();
        target.current = 1;
        if (interactive) {
          setHot(true);
          document.body.style.cursor = 'pointer';
        }
      }}
      onPointerOut={() => {
        target.current = 0;
        setHot(false);
        document.body.style.cursor = '';
      }}
      onClick={(e) => {
        if (!href) return;
        e.stopPropagation();
        router.push(href);
      }}
    >
      <group ref={inner}>{children}</group>
      {label && (
        <Html center position={[0, 1.7, 0]} distanceFactor={9} style={{ pointerEvents: 'none' }}>
          <div
            className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur transition-all duration-200 ${
              hot
                ? 'scale-110 border-orange-300 bg-orange-500 text-white shadow-lg'
                : 'border-white/20 bg-black/55 text-white/85'
            }`}
          >
            {label} {hot && '→'}
          </div>
        </Html>
      )}
    </group>
  );
}


function Glow({ color, intensity = 0.6 }: { color: string; intensity?: number }) {
  return <meshStandardMaterial color={color} emissive={color} emissiveIntensity={intensity} roughness={0.3} metalness={0.15} />;
}

/* ───────────────────────── Arcade objects ───────────────────────── */

function Gamepad() {
  return (
    <group>
      <mesh>
        <boxGeometry args={[2.4, 0.38, 1.25]} />
        <meshStandardMaterial color="#4f46e5" roughness={0.4} metalness={0.2} />
      </mesh>
      {/* grips */}
      <mesh position={[-1.15, -0.05, 0.35]} rotation={[0, 0, 0.1]}>
        <capsuleGeometry args={[0.38, 0.6, 6, 14]} />
        <meshStandardMaterial color="#4f46e5" roughness={0.4} metalness={0.2} />
      </mesh>
      <mesh position={[1.15, -0.05, 0.35]} rotation={[0, 0, -0.1]}>
        <capsuleGeometry args={[0.38, 0.6, 6, 14]} />
        <meshStandardMaterial color="#4f46e5" roughness={0.4} metalness={0.2} />
      </mesh>
      {/* d-pad */}
      <mesh position={[-0.75, 0.22, -0.05]}>
        <boxGeometry args={[0.5, 0.1, 0.16]} />
        <Glow color={CYAN} />
      </mesh>
      <mesh position={[-0.75, 0.22, -0.05]}>
        <boxGeometry args={[0.16, 0.1, 0.5]} />
        <Glow color={CYAN} />
      </mesh>
      {/* buttons */}
      {[
        [0.65, 0.12, ORANGE],
        [0.95, -0.12, PINK],
        [0.95, 0.12, BLUE],
        [1.25, -0.12 + 0.12, '#facc15'],
      ].map(([x, z, c], i) => (
        <mesh key={i} position={[x as number, 0.22, (z as number) - 0.05]}>
          <cylinderGeometry args={[0.1, 0.1, 0.1, 20]} />
          <Glow color={c as string} intensity={0.9} />
        </mesh>
      ))}
      {/* sticks */}
      {[-0.25, 0.4].map((x, i) => (
        <group key={i} position={[x, 0.2, 0.35]}>
          <mesh>
            <cylinderGeometry args={[0.14, 0.17, 0.12, 20]} />
            <meshStandardMaterial color="#64748b" roughness={0.4} metalness={0.2} />
          </mesh>
          <mesh position={[0, 0.1, 0]}>
            <sphereGeometry args={[0.13, 16, 16]} />
            <meshStandardMaterial color="#94a3b8" roughness={0.35} metalness={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Dice() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#fff7ed" roughness={0.3} metalness={0.1} />
      {/* pips on 3 faces */}
      {[
        [0, 0, 0.51, 0, 0],
        [0.51, 0.22, 0.22, 0, Math.PI / 2],
        [0.51, -0.22, -0.22, 0, Math.PI / 2],
        [0.22, 0.51, 0.22, Math.PI / 2, 0],
        [-0.22, 0.51, -0.22, Math.PI / 2, 0],
        [0, 0.51, 0, Math.PI / 2, 0],
      ].map(([x, y, z, rx, ry], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[rx, ry, 0]}>
          <circleGeometry args={[0.09, 16]} />
          <meshBasicMaterial color="#9a3412" />
        </mesh>
      ))}
    </mesh>
  );
}

function VRGem() {
  return (
    <group>
      <mesh>
        <octahedronGeometry args={[0.85, 0]} />
        <meshStandardMaterial color={VIOLET} emissive={VIOLET} emissiveIntensity={0.55} roughness={0.2} metalness={0.2} flatShading />
      </mesh>
      <mesh scale={1.35}>
        <octahedronGeometry args={[0.85, 0]} />
        <meshBasicMaterial color={VIOLET} wireframe transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

function Joystick() {
  return (
    <group>
      <mesh position={[0, -0.55, 0]}>
        <cylinderGeometry args={[0.55, 0.65, 0.22, 28]} />
        <meshStandardMaterial color="#475569" roughness={0.45} metalness={0.2} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.07, 0.07, 1.1, 14]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.3} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.65, 0]}>
        <sphereGeometry args={[0.32, 24, 24]} />
        <Glow color="#ef4444" intensity={0.8} />
      </mesh>
    </group>
  );
}

function DiscoBall() {
  return (
    <mesh>
      <icosahedronGeometry args={[0.75, 1]} />
      <meshStandardMaterial color="#f1f5f9" emissive="#6366f1" emissiveIntensity={0.25} roughness={0.25} metalness={0.25} flatShading />
    </mesh>
  );
}

function Rings() {
  const ref = useRef<THREE.Group>(null!);
  useFrame((_, dt) => {
    ref.current.rotation.z += dt * 0.15;
    ref.current.rotation.x += dt * 0.05;
  });
  return (
    <group ref={ref}>
      <mesh rotation={[Math.PI / 2.4, 0, 0]}>
        <torusGeometry args={[3.2, 0.012, 8, 160]} />
        <meshBasicMaterial color={ORANGE} transparent opacity={0.7} />
      </mesh>
      <mesh rotation={[Math.PI / 3, 0.6, 0]}>
        <torusGeometry args={[3.9, 0.01, 8, 160]} />
        <meshBasicMaterial color={CYAN} transparent opacity={0.45} />
      </mesh>
      <mesh rotation={[Math.PI / 1.8, -0.4, 0]}>
        <torusGeometry args={[4.6, 0.008, 8, 160]} />
        <meshBasicMaterial color={VIOLET} transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

/* ───────────────────────── Scene root ───────────────────────── */

function Rig({ pointer, children }: { pointer: React.MutableRefObject<Pointer>; children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null!);
  useFrame((state) => {
    const { x, y } = pointer.current;
    ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, x * 0.45, 0.06);
    ref.current.rotation.x = THREE.MathUtils.lerp(ref.current.rotation.x, -y * 0.25, 0.06);
    // camera drift for depth
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, x * 0.6, 0.04);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, y * 0.4, 0.04);
    state.camera.lookAt(0, 0, 0);
  });
  return <group ref={ref}>{children}</group>;
}

export default function ArcadeScene({
  variant = 'hero',
  active = true,
}: {
  variant?: 'hero' | 'stage';
  active?: boolean;
}) {
  const pointer = useRef<Pointer>({ x: 0, y: 0 });
  const hero = variant === 'hero';

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      dpr={[1, 1.6]}
      camera={{ position: [0, 0, hero ? 9 : 8], fov: hero ? 45 : 50 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ touchAction: 'pan-y' }}
      aria-hidden
    >
      <ambientLight intensity={0.9} />
      <hemisphereLight args={["#c7d2fe", "#1e1b4b", 0.8]} />
      <directionalLight position={[5, 6, 5]} intensity={1.6} color="#fff1e0" />
      <pointLight position={[-6, -2, 3]} intensity={30} color={VIOLET} />
      <pointLight position={[6, -3, 2]} intensity={24} color={ORANGE} />
      <pointLight position={[0, 4, -4]} intensity={18} color={CYAN} />

      <Rig pointer={pointer}>
        <Particles count={hero ? 700 : 350} radius={hero ? 10 : 8} />
        <Rings />

        {hero && (
          <>
            <Floaty position={[0, 0.1, 0]} speed={0.8} spin={[0.05, 0.28, 0.02]} amp={0.18} scale={1.15} href="/services/interactive-games-rental" label="Interactive Games">
              <group rotation={[0.5, 0, 0]}>
                <Gamepad />
              </group>
            </Floaty>
            <Floaty position={[-3.6, 1.7, -0.5]} speed={0.9} spin={[0.35, 0.5, 0.1]} scale={0.9} href="/services/team-building-activities" label="Team Building">
              <Dice />
            </Floaty>
            <Floaty position={[3.5, 1.9, -0.3]} speed={1.1} spin={[0.2, 0.6, 0.15]} scale={0.95} href="/events" label="VR & AI Experiences">
              <VRGem />
            </Floaty>
            <Floaty position={[-3.3, -1.9, 0.4]} speed={0.7} spin={[0.05, 0.4, 0.05]} scale={0.95} href="/services/brand-activation-activities" label="Brand Activation">
              <Joystick />
            </Floaty>
            <Floaty position={[3.4, -1.7, 0.3]} speed={1.0} spin={[0.1, 0.3, 0.2]} scale={0.8} href="/services/photobooth-rentals" label="Photo Booths">
              <DiscoBall />
            </Floaty>
          </>
        )}
      </Rig>
    </Canvas>
  );
}
