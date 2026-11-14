'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { KIND_COLOR, GUESTS_PER_DOT, floorSide, type Kind, type Station } from './planner-utils';

/* ─────────────── Station models (primitives only) ─────────────── */

function Model({ kind, color }: { kind: Kind; color: string }) {
  const body = <meshStandardMaterial color="#64748b" roughness={0.5} metalness={0.15} />;
  const glow = <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.9} roughness={0.3} />;
  switch (kind) {
    case 'booth':
      return (
        <group>
          <mesh position={[0, 1, 0]}>
            <cylinderGeometry args={[0.9, 0.9, 2, 28, 1, true]} />
            <meshStandardMaterial color="#94a3b8" roughness={0.45} metalness={0.15} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 2.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.9, 0.06, 12, 40]} />
            {glow}
          </mesh>
          <mesh position={[0, 1.1, 0]}>
            <sphereGeometry args={[0.28, 20, 20]} />
            {glow}
          </mesh>
        </group>
      );
    case 'vr':
      return (
        <group>
          <mesh position={[0, 0.25, 0]}>
            <cylinderGeometry args={[0.8, 0.9, 0.5, 28]} />
            {body}
          </mesh>
          <mesh position={[0, 1.5, 0]}>
            <octahedronGeometry args={[0.7, 0]} />
            {glow}
          </mesh>
        </group>
      );
    case 'arcade':
      return (
        <group>
          <mesh position={[0, 1, 0]}>
            <boxGeometry args={[1.3, 2, 1]} />
            {body}
          </mesh>
          <mesh position={[0, 1.4, 0.51]}>
            <planeGeometry args={[1, 0.8]} />
            <meshBasicMaterial color={color} />
          </mesh>
          <mesh position={[0, 0.8, 0.62]}>
            <boxGeometry args={[1.1, 0.15, 0.3]} />
            {glow}
          </mesh>
        </group>
      );
    case 'ai':
      return (
        <group>
          <mesh position={[0, 0.3, 0]}>
            <cylinderGeometry args={[0.5, 0.7, 0.6, 24]} />
            {body}
          </mesh>
          <mesh position={[0, 1.4, 0]}>
            <icosahedronGeometry args={[0.65, 1]} />
            {glow}
          </mesh>
        </group>
      );
    case 'game':
      return (
        <group>
          <mesh position={[0, 0.6, 0]}>
            <boxGeometry args={[1.6, 1.2, 1.6]} />
            {body}
          </mesh>
          <mesh position={[0, 1.25, 0]}>
            <boxGeometry args={[1.7, 0.1, 1.7]} />
            {glow}
          </mesh>
        </group>
      );
    default:
      return (
        <group>
          <mesh position={[0, 0.7, 0]}>
            <boxGeometry args={[1.3, 1.4, 1.3]} />
            {body}
          </mesh>
          <mesh position={[0, 1.45, 0]}>
            <boxGeometry args={[1.4, 0.08, 1.4]} />
            {glow}
          </mesh>
        </group>
      );
  }
}

function StationNode({
  s,
  selected,
  onDown,
}: {
  s: Station;
  selected: boolean;
  onDown: (uid: string) => void;
}) {
  const ref = useRef<THREE.Group>(null!);
  const appear = useRef(0);
  const hover = useRef(false);
  const color = KIND_COLOR[s.kind];

  useFrame((st, dt) => {
    appear.current = Math.min(1, appear.current + dt * 2.6);
    const k = 1 - Math.pow(1 - appear.current, 3);
    const target = (selected ? 1.1 : hover.current ? 1.05 : 1) * k;
    const g = ref.current;
    g.scale.setScalar(THREE.MathUtils.lerp(g.scale.x, target, 0.25));
    g.position.set(s.x, selected ? 0.12 + Math.sin(st.clock.elapsedTime * 3) * 0.06 : 0, s.z);
    g.rotation.y += dt * (selected ? 0.9 : 0.15);
  });

  return (
    <group
      ref={ref}
      scale={0.001}
      onPointerDown={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        onDown(s.uid);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        hover.current = true;
        document.body.style.cursor = 'grab';
      }}
      onPointerOut={() => {
        hover.current = false;
        document.body.style.cursor = '';
      }}
    >
      {/* footprint ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[1.15, selected ? 1.4 : 1.25, 40]} />
        <meshBasicMaterial color={color} transparent opacity={selected ? 0.95 : 0.55} side={THREE.DoubleSide} />
      </mesh>
      <Model kind={s.kind} color={color} />
      <Html center position={[0, 2.9, 0]} distanceFactor={11} style={{ pointerEvents: 'none' }}>
        <div
          className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur ${
            selected ? 'border-orange-300 bg-orange-500/90 text-white' : 'border-white/20 bg-black/60 text-white/90'
          }`}
        >
          {s.title}
        </div>
      </Html>
    </group>
  );
}

/* ─────────────── Guests crowd ─────────────── */

function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}



function Crowd({ guests, side }: { guests: number; side: number }) {
  const count = Math.min(250, Math.max(5, Math.round(guests / GUESTS_PER_DOT)));
  const ref = useRef<THREE.InstancedMesh>(null!);
  const base = useMemo(() => {
    const rnd = mulberry32(guests * 7 + 13);
    const half = side / 2 - 0.8;
    return Array.from({ length: count }, () => ({
      x: (rnd() * 2 - 1) * half,
      z: (rnd() * 2 - 1) * half,
      p: rnd() * 6.28,
    }));
  }, [count, guests, side]);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((s) => {
    const t = s.clock.elapsedTime;
    base.forEach((b, i) => {
      dummy.position.set(b.x, 0.25 + Math.abs(Math.sin(t * 1.4 + b.p)) * 0.12, b.z);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} key={count}>
      <capsuleGeometry args={[0.1, 0.22, 4, 8]} />
      <meshStandardMaterial color="#c7d2fe" emissive="#6366f1" emissiveIntensity={0.35} roughness={0.5} />
    </instancedMesh>
  );
}

/* ─────────────── Floor + entrance ─────────────── */

function Venue({ side }: { side: number }) {
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(side, 0.2, side)), [side]);
  return (
    <group>
      <mesh position={[0, -0.1, 0]}>
        <boxGeometry args={[side, 0.2, side]} />
        <meshStandardMaterial color="#0b1030" roughness={0.6} metalness={0.3} />
      </mesh>
      <lineSegments position={[0, -0.1, 0]} geometry={edges}>
        <lineBasicMaterial color="#fb923c" />
      </lineSegments>
      <gridHelper args={[side, Math.round(side), '#fb923c', '#2a2f5e']} position={[0, 0.012, 0]} />
      {/* entrance arch */}
      <group position={[0, 0, side / 2 - 0.15]}>
        {[-1.6, 1.6].map((x) => (
          <mesh key={x} position={[x, 1.2, 0]}>
            <boxGeometry args={[0.18, 2.4, 0.18]} />
            <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={1} />
          </mesh>
        ))}
        <mesh position={[0, 2.4, 0]}>
          <boxGeometry args={[3.4, 0.18, 0.18]} />
          <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={1} />
        </mesh>
        <Html center position={[0, 3, 0]} distanceFactor={12} style={{ pointerEvents: 'none' }}>
          <div className="rounded-full border border-violet-300/40 bg-violet-600/70 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white">
            Entrance
          </div>
        </Html>
      </group>
    </group>
  );
}

/* ─────────────── Scene ─────────────── */

export default function PlannerScene({
  stations,
  selected,
  guests,
  onSelect,
  onMove,
}: {
  stations: Station[];
  selected: string | null;
  guests: number;
  onSelect: (uid: string | null) => void;
  onMove: (uid: string, x: number, z: number) => void;
}) {
  const side = floorSide(guests);
  const drag = useRef<string | null>(null);
  const controls = useRef<any>(null);
  const idle = useRef(true);

  useEffect(() => {
    const up = () => {
      drag.current = null;
      if (controls.current) controls.current.enabled = true;
      document.body.style.cursor = '';
    };
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, []);

  const half = side / 2 - 1.3;

  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [11, 10, 12], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
      style={{ touchAction: 'none' }}
      onPointerMissed={() => onSelect(null)}
      aria-label="Interactive 3D venue. Drag stations to move them, drag empty space to rotate, scroll to zoom."
    >
      <fog attach="fog" args={['#05071a', 24, 60]} />
      <ambientLight intensity={1.3} />
      <hemisphereLight args={['#c7d2fe', '#1e1b4b', 0.7]} />
      <directionalLight position={[8, 14, 6]} intensity={1.6} />
      <pointLight position={[-8, 4, -6]} intensity={40} color="#8b5cf6" />
      <pointLight position={[8, 4, 8]} intensity={30} color="#fb923c" />

      <Venue side={side} />
      <Crowd guests={guests} side={side} />

      {stations.map((s) => (
        <StationNode
          key={s.uid}
          s={s}
          selected={selected === s.uid}
          onDown={(uid) => {
            drag.current = uid;
            idle.current = false;
            if (controls.current) {
              controls.current.enabled = false;
              controls.current.autoRotate = false;
            }
            document.body.style.cursor = 'grabbing';
            onSelect(uid);
          }}
        />
      ))}

      {/* invisible catch-plane that tracks the pointer while dragging */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.02, 0]}
        onPointerMove={(e) => {
          if (!drag.current) return;
          e.stopPropagation();
          onMove(
            drag.current,
            THREE.MathUtils.clamp(e.point.x, -half, half),
            THREE.MathUtils.clamp(e.point.z, -half, half)
          );
        }}
      >
        <planeGeometry args={[80, 80]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <OrbitControls
        ref={controls}
        makeDefault
        autoRotate
        autoRotateSpeed={0.6}
        enablePan={false}
        minDistance={7}
        maxDistance={34}
        maxPolarAngle={Math.PI / 2.15}
        onStart={() => {
          if (controls.current) controls.current.autoRotate = false;
        }}
      />
    </Canvas>
  );
}
