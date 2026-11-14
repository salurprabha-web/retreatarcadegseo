'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Site-wide fixed backdrop. One canvas, shared by every page.
 * - Starfield + drifting wireframe solids at different depths
 * - Camera travels *through* the scene as you scroll (real parallax depth)
 * - Pointer steers the whole field
 */

const COLORS = ['#fb923c', '#8b5cf6', '#22d3ee', '#f472b6', '#3b82f6'];

function Stars({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null!);
  const positions = useMemo(() => {
    const a = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      a[i * 3] = (Math.random() - 0.5) * 60;
      a[i * 3 + 1] = (Math.random() - 0.5) * 120; // tall: camera descends with scroll
      a[i * 3 + 2] = -Math.random() * 40;
    }
    return a;
  }, [count]);
  useFrame((_, dt) => {
    ref.current.rotation.z += dt * 0.004;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.06} color="#c7d2fe" transparent opacity={0.7} sizeAttenuation depthWrite={false} />
    </points>
  );
}

function Shape({
  kind,
  position,
  color,
  size,
  speed,
}: {
  kind: number;
  position: [number, number, number];
  color: string;
  size: number;
  speed: number;
}) {
  const ref = useRef<THREE.Mesh>(null!);
  const phase = useMemo(() => Math.random() * 10, []);
  useFrame((s, dt) => {
    const m = ref.current;
    m.rotation.x += dt * speed * 0.5;
    m.rotation.y += dt * speed;
    m.position.y = position[1] + Math.sin(s.clock.elapsedTime * 0.4 + phase) * 0.6;
  });
  return (
    <mesh ref={ref} position={position} scale={size}>
      {kind === 0 && <icosahedronGeometry args={[1, 0]} />}
      {kind === 1 && <torusGeometry args={[1, 0.28, 10, 36]} />}
      {kind === 2 && <octahedronGeometry args={[1, 0]} />}
      {kind === 3 && <boxGeometry args={[1.4, 1.4, 1.4]} />}
      {kind === 4 && <torusKnotGeometry args={[0.8, 0.22, 80, 10]} />}
      <meshBasicMaterial color={color} wireframe transparent opacity={0.2} />
    </mesh>
  );
}

function Field({ shapesCount }: { shapesCount: number }) {
  const group = useRef<THREE.Group>(null!);
  const pointer = useRef({ x: 0, y: 0 });
  const scroll = useRef(0);
  const smooth = useRef(0);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    const sc = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      scroll.current = window.scrollY / max;
    };
    sc();
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('scroll', sc, { passive: true });
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('scroll', sc);
    };
  }, []);

  const shapes = useMemo(
    () =>
      Array.from({ length: shapesCount }, (_, i) => ({
        kind: i % 5,
        color: COLORS[i % COLORS.length],
        // spread along the vertical travel path, alternating sides so the centre stays calm
        position: [
          (i % 2 === 0 ? -1 : 1) * (4 + Math.random() * 7),
          -i * (80 / shapesCount) + 8 + Math.random() * 3,
          -2 - Math.random() * 14,
        ] as [number, number, number],
        size: 0.9 + Math.random() * 1.8,
        speed: 0.08 + Math.random() * 0.22,
      })),
    [shapesCount]
  );

  useFrame((state) => {
    smooth.current = THREE.MathUtils.lerp(smooth.current, scroll.current, 0.06);
    const cam = state.camera;
    // fly down the field as the page scrolls
    cam.position.y = -smooth.current * 55;
    cam.position.x = THREE.MathUtils.lerp(cam.position.x, pointer.current.x * 1.4, 0.04);
    cam.rotation.z = THREE.MathUtils.lerp(cam.rotation.z, -pointer.current.x * 0.04, 0.04);
    cam.lookAt(cam.position.x * 0.3, cam.position.y - 0.5 + pointer.current.y * -0.8, -10);
    group.current.rotation.y = smooth.current * 1.2;
  });

  return (
    <group ref={group}>
      <Stars count={shapesCount > 12 ? 900 : 450} />
      {shapes.map((s, i) => (
        <Shape key={i} {...s} />
      ))}
    </group>
  );
}

export default function BackdropScene({ active = true, lite = false }: { active?: boolean; lite?: boolean }) {
  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      dpr={[1, lite ? 1 : 1.35]}
      camera={{ position: [0, 0, 8], fov: 55, near: 0.1, far: 80 }}
      gl={{ antialias: !lite, alpha: true, powerPreference: 'high-performance' }}
      style={{ pointerEvents: 'none' }}
      aria-hidden
    >
      <Field shapesCount={lite ? 10 : 18} />
    </Canvas>
  );
}
