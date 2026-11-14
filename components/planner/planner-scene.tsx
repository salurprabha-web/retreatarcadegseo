'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  KIND_COLOR,
  KIND_RADIUS,
  GUESTS_PER_DOT,
  RUNWAY_LEN,
  THEMES,
  WALL_COLORS,
  resolveCollisions,
  stage2Rect,
  seatCount,
  stageRect,
  theatreSeats,
  type Bounds,
  type EntranceStyle,
  type TimeOfDay,
  type WallColor,
  type Kind,
  type LightTheme,
  type StageRect,
  type StageSide,
  type Station,
  type Venue,
  type VenueConfig,
} from './planner-utils';

export type PlannerApi = { snapshot: () => string | null; zoom: (factor: number) => void };
export type ViewCmd = { mode: 'free' | 'overview' | 'top' | 'entrance' | 'tour'; n: number };
export type StationInfo = { image: string | null; price: number | null };

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

/* ─────────────── Detailed product models (primitives only) ─────────────── */

const dark = '#1e2347';
const steel = '#8b94b8';

function Glow({ color, i = 1.2 }: { color: string; i?: number }) {
  return <meshStandardMaterial color={color} emissive={color} emissiveIntensity={i} roughness={0.35} />;
}
function Body({ color = dark, metal = 0.35, rough = 0.5 }: { color?: string; metal?: number; rough?: number }) {
  return <meshStandardMaterial color={color} roughness={rough} metalness={metal} />;
}

function Booth360({ color }: { color: string }) {
  const arm = useRef<THREE.Group>(null!);
  useFrame((_, dt) => (arm.current.rotation.y += dt * 0.9));
  return (
    <group>
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[1.15, 1.2, 0.2, 40]} />
        <Body color="#2b2f5e" />
      </mesh>
      <mesh position={[0, 0.21, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.95, 1.1, 48]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <group ref={arm}>
        <mesh position={[0, 1.1, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 2, 10]} />
          <Body color={steel} metal={0.7} />
        </mesh>
        <mesh position={[0.55, 2.0, 0]}>
          <boxGeometry args={[1.1, 0.07, 0.12]} />
          <Body color={steel} metal={0.7} />
        </mesh>
        <mesh position={[1.12, 1.9, 0]}>
          <boxGeometry args={[0.18, 0.32, 0.06]} />
          <Glow color="#bae6fd" i={0.8} />
        </mesh>
      </group>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 1.35, 0, 0.35]}>
          <mesh position={[0, 0.8, 0]}>
            <cylinderGeometry args={[0.03, 0.05, 1.6, 8]} />
            <Body color={steel} metal={0.7} />
          </mesh>
          <mesh position={[0, 1.75, 0]} rotation={[0, s * 0.6, 0]}>
            <torusGeometry args={[0.32, 0.05, 12, 32]} />
            <Glow color="#ffffff" i={2} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function MirrorBooth({ color }: { color: string }) {
  return (
    <group>
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[1.5, 0.3, 0.7]} />
        <Body color="#2b2f5e" />
      </mesh>
      <mesh position={[0, 1.4, 0]}>
        <boxGeometry args={[1.25, 2.2, 0.12]} />
        <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.9} />
      </mesh>
      <mesh position={[0, 1.4, 0.07]}>
        <planeGeometry args={[1.05, 2.0]} />
        <meshStandardMaterial color="#c7d2fe" emissive="#818cf8" emissiveIntensity={0.45} metalness={1} roughness={0.08} />
      </mesh>
      {[
        [0, 2.53, 1.3, 0.06],
        [0, 0.28, 1.3, 0.06],
      ].map((r, i) => (
        <mesh key={i} position={[r[0], r[1], 0.08]}>
          <boxGeometry args={[r[2], r[3], 0.05]} />
          <Glow color={color} i={1.6} />
        </mesh>
      ))}
      {[-0.62, 0.62].map((x) => (
        <mesh key={x} position={[x, 1.4, 0.08]}>
          <boxGeometry args={[0.06, 2.3, 0.05]} />
          <Glow color={color} i={1.6} />
        </mesh>
      ))}
      <mesh position={[0, 2.7, 0.05]}>
        <sphereGeometry args={[0.1, 14, 14]} />
        <Glow color="#fde047" />
      </mesh>
    </group>
  );
}

function VRPod({ color }: { color: string }) {
  const a = useRef<THREE.Mesh>(null!);
  const b = useRef<THREE.Mesh>(null!);
  const head = useRef<THREE.Group>(null!);
  useFrame((s, dt) => {
    a.current.rotation.x += dt * 0.9;
    b.current.rotation.y += dt * 1.2;
    head.current.position.y = 1.7 + Math.sin(s.clock.elapsedTime * 2) * 0.06;
  });
  return (
    <group>
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[1.35, 1.4, 0.24, 6]} />
        <Body color="#2b2f5e" />
      </mesh>
      <mesh position={[0, 0.25, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.0, 1.15, 6]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh ref={a} position={[0, 1.2, 0]}>
        <torusGeometry args={[0.95, 0.035, 10, 48]} />
        <Glow color={color} i={1.5} />
      </mesh>
      <mesh ref={b} position={[0, 1.2, 0]}>
        <torusGeometry args={[0.8, 0.035, 10, 48]} />
        <Glow color="#67e8f9" i={1.5} />
      </mesh>
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 0.8, 10]} />
        <Body color={steel} metal={0.7} />
      </mesh>
      <group ref={head} position={[0, 1.7, 0]}>
        <mesh>
          <boxGeometry args={[0.5, 0.26, 0.28]} />
          <Body color="#0f172a" metal={0.6} rough={0.3} />
        </mesh>
        <mesh position={[0, 0, 0.15]}>
          <boxGeometry args={[0.4, 0.16, 0.02]} />
          <Glow color={color} i={1.8} />
        </mesh>
      </group>
    </group>
  );
}

function ArcadeCabinet({ color }: { color: string }) {
  return (
    <group>
      <mesh position={[0, 0.9, -0.05]}>
        <boxGeometry args={[1.05, 1.8, 0.85]} />
        <Body color="#1b1f45" metal={0.2} />
      </mesh>
      <mesh position={[0, 1.2, 0.4]} rotation={[-0.2, 0, 0]}>
        <planeGeometry args={[0.85, 0.65]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.78, 0.5]} rotation={[-0.35, 0, 0]}>
        <boxGeometry args={[1.05, 0.12, 0.42]} />
        <Body color="#0f172a" />
      </mesh>
      <mesh position={[-0.25, 0.9, 0.55]}>
        <cylinderGeometry args={[0.025, 0.025, 0.18, 8]} />
        <Body color="#e2e8f0" metal={0.7} />
      </mesh>
      <mesh position={[-0.25, 1.0, 0.55]}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <Glow color="#ef4444" i={1} />
      </mesh>
      {[0.05, 0.2, 0.35].map((x, i) => (
        <mesh key={x} position={[x, 0.82, 0.55]} rotation={[-0.35, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.03, 12]} />
          <Glow color={['#22d3ee', '#facc15', '#4ade80'][i]} i={1.4} />
        </mesh>
      ))}
      <mesh position={[0, 1.88, 0.05]}>
        <boxGeometry args={[1.05, 0.22, 0.7]} />
        <Glow color={color} i={1.3} />
      </mesh>
      <mesh position={[0, 0.07, 0.1]}>
        <boxGeometry args={[1.15, 0.14, 1]} />
        <Body color="#0f172a" />
      </mesh>
    </group>
  );
}

function ClawMachine({ color }: { color: string }) {
  const claw = useRef<THREE.Group>(null!);
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    claw.current.position.x = Math.sin(t * 0.9) * 0.28;
    claw.current.position.y = 1.55 - (Math.sin(t * 1.8) * 0.5 + 0.5) * 0.5;
  });
  const prizes = useMemo(
    () => Array.from({ length: 12 }, (_, i) => ({ x: ((i % 4) - 1.5) * 0.24, z: (Math.floor(i / 4) - 1) * 0.24, c: ['#f472b6', '#facc15', '#38bdf8', '#4ade80'][i % 4] })),
    []
  );
  return (
    <group>
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[1.05, 0.9, 1.05]} />
        <Body color="#312e81" />
      </mesh>
      <mesh position={[0, 1.45, 0]}>
        <boxGeometry args={[0.98, 1.1, 0.98]} />
        <meshStandardMaterial color="#bfdbfe" transparent opacity={0.22} roughness={0.05} />
      </mesh>
      {[
        [-0.5, -0.5],
        [0.5, -0.5],
        [-0.5, 0.5],
        [0.5, 0.5],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 1.45, z]}>
          <boxGeometry args={[0.05, 1.1, 0.05]} />
          <Glow color={color} i={1.2} />
        </mesh>
      ))}
      <mesh position={[0, 2.05, 0]}>
        <boxGeometry args={[1.08, 0.18, 1.08]} />
        <Glow color={color} i={1.2} />
      </mesh>
      {prizes.map((p, i) => (
        <mesh key={i} position={[p.x, 0.99 + (i % 3) * 0.04, p.z]}>
          <sphereGeometry args={[0.11, 12, 12]} />
          <meshStandardMaterial color={p.c} roughness={0.7} />
        </mesh>
      ))}
      <group ref={claw} position={[0, 1.55, 0]}>
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.6, 6]} />
          <Body color={steel} metal={0.8} />
        </mesh>
        <mesh>
          <cylinderGeometry args={[0.07, 0.04, 0.1, 10]} />
          <Body color={steel} metal={0.8} />
        </mesh>
      </group>
    </group>
  );
}

function HoopGame({ color }: { color: string }) {
  const ball = useRef<THREE.Mesh>(null!);
  useFrame((s) => {
    const t = (s.clock.elapsedTime * 1.4) % 1;
    ball.current.position.set(0, 0.4 + Math.sin(t * Math.PI) * 1.5, 0.9 - t * 0.95);
  });
  return (
    <group>
      <mesh position={[0, 0.06, -0.05]}>
        <boxGeometry args={[1.6, 0.12, 2.6]} />
        <Body color="#0f172a" />
      </mesh>
      <mesh position={[0, 0.14, 0.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.2, 2]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.25} />
      </mesh>
      <mesh position={[0, 1.2, -1.15]}>
        <boxGeometry args={[0.1, 2.4, 0.1]} />
        <Body color={steel} metal={0.7} />
      </mesh>
      <mesh position={[0, 2.25, -1.0]}>
        <boxGeometry args={[1.3, 0.85, 0.06]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.3} />
      </mesh>
      <mesh position={[0, 2.05, -0.72]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.22, 0.025, 10, 28]} />
        <Glow color="#f97316" i={1.2} />
      </mesh>
      <mesh position={[0, 1.8, -0.72]}>
        <coneGeometry args={[0.2, 0.4, 14, 1, true]} />
        <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.6} />
      </mesh>
      <mesh ref={ball}>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshStandardMaterial color="#f97316" roughness={0.6} />
      </mesh>
    </group>
  );
}

function AIKiosk({ color }: { color: string }) {
  const head = useRef<THREE.Group>(null!);
  useFrame((s) => (head.current.rotation.y = Math.sin(s.clock.elapsedTime * 0.8) * 0.5));
  return (
    <group>
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.6, 0.75, 0.7, 28]} />
        <Body color="#2b2f5e" />
      </mesh>
      <mesh position={[0, 1.05, -0.2]} rotation={[-0.1, 0, 0]}>
        <boxGeometry args={[1.0, 0.65, 0.08]} />
        <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.5} />
      </mesh>
      <mesh position={[0, 1.05, -0.155]} rotation={[-0.1, 0, 0]}>
        <planeGeometry args={[0.9, 0.55]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <group ref={head} position={[0, 1.8, -0.15]}>
        <mesh>
          <sphereGeometry args={[0.34, 24, 24]} />
          <Body color="#e2e8f0" metal={0.5} rough={0.25} />
        </mesh>
        {[-0.12, 0.12].map((x) => (
          <mesh key={x} position={[x, 0.04, 0.3]}>
            <sphereGeometry args={[0.065, 12, 12]} />
            <Glow color={color} i={2.2} />
          </mesh>
        ))}
        <mesh position={[0, 0.42, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.22, 6]} />
          <Body color={steel} metal={0.8} />
        </mesh>
        <mesh position={[0, 0.55, 0]}>
          <sphereGeometry args={[0.05, 10, 10]} />
          <Glow color="#fde047" />
        </mesh>
      </group>
    </group>
  );
}

function GameTable({ color }: { color: string }) {
  return (
    <group>
      <mesh position={[0, 0.75, 0]}>
        <boxGeometry args={[2.0, 0.2, 1.2]} />
        <Body color="#334155" />
      </mesh>
      <mesh position={[0, 0.86, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.8, 1.0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.28} roughness={0.7} />
      </mesh>
      {[
        [-0.85, -0.45],
        [0.85, -0.45],
        [-0.85, 0.45],
        [0.85, 0.45],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.33, z]}>
          <boxGeometry args={[0.12, 0.66, 0.12]} />
          <Body color="#0f172a" />
        </mesh>
      ))}
      {[-0.6, -0.2, 0.2, 0.6].map((x) => (
        <mesh key={x} position={[x, 0.95, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 1.5, 6]} />
          <Body color={steel} metal={0.8} />
        </mesh>
      ))}
      <mesh position={[0, 1.7, 0]}>
        <boxGeometry args={[2.0, 0.06, 0.06]} />
        <Glow color={color} i={1.4} />
      </mesh>
    </group>
  );
}

function ActivityCase({ color }: { color: string }) {
  return (
    <group>
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[1.6, 1.1, 1.0]} />
        <Body color="#334155" metal={0.5} />
      </mesh>
      {[-0.7, 0.7].map((x) => (
        <mesh key={x} position={[x, 0.55, 0.51]}>
          <boxGeometry args={[0.08, 1.12, 0.03]} />
          <Body color={steel} metal={0.8} />
        </mesh>
      ))}
      <mesh position={[0, 1.15, 0]}>
        <boxGeometry args={[1.65, 0.07, 1.05]} />
        <Glow color={color} i={1.2} />
      </mesh>
      <mesh position={[0, 1.8, 0]}>
        <octahedronGeometry args={[0.38, 0]} />
        <Glow color={color} i={1.3} />
      </mesh>
    </group>
  );
}

function Model({ kind, color }: { kind: Kind; color: string }) {
  switch (kind) {
    case 'booth':
      return <Booth360 color={color} />;
    case 'mirror':
      return <MirrorBooth color={color} />;
    case 'vr':
      return <VRPod color={color} />;
    case 'arcade':
      return <ArcadeCabinet color={color} />;
    case 'claw':
      return <ClawMachine color={color} />;
    case 'hoop':
      return <HoopGame color={color} />;
    case 'ai':
      return <AIKiosk color={color} />;
    case 'table':
      return <GameTable color={color} />;
    default:
      return <ActivityCase color={color} />;
  }
}

/* ─────────────── Station node ─────────────── */

function StationNode({
  s,
  info,
  selected,
  onDown,
}: {
  s: Station;
  info?: StationInfo;
  selected: boolean;
  onDown: (uid: string) => void;
}) {
  const ref = useRef<THREE.Group>(null!);
  const inner = useRef<THREE.Group>(null!);
  const appear = useRef(0);
  const hover = useRef(false);
  const color = KIND_COLOR[s.kind];
  const r = KIND_RADIUS[s.kind];

  useFrame((st, dt) => {
    appear.current = Math.min(1, appear.current + dt * 2.4);
    const k = 1 - Math.pow(1 - appear.current, 3);
    const g = ref.current;
    // smooth follow of the dragged position, drop-in on first appearance
    g.position.x = THREE.MathUtils.lerp(g.position.x, s.x, 0.35);
    g.position.z = THREE.MathUtils.lerp(g.position.z, s.z, 0.35);
    g.position.y = (1 - k) * 3;
    g.scale.setScalar(THREE.MathUtils.lerp(g.scale.x, (hover.current && !selected ? 1.04 : 1) * Math.max(0.001, k), 0.25));
    inner.current.rotation.y = THREE.MathUtils.lerp(inner.current.rotation.y, s.rot, 0.2);
    inner.current.position.y = selected ? 0.1 + Math.sin(st.clock.elapsedTime * 3) * 0.04 : 0;
  });

  return (
    <group
      ref={ref}
      position={[s.x, 3, s.z]}
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
      {/* footprint */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[r * 0.9, r * (selected ? 1.1 : 0.98), 56]} />
        <meshBasicMaterial color={color} transparent opacity={selected ? 0.95 : 0.5} side={THREE.DoubleSide} />
      </mesh>
      {selected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}>
          <circleGeometry args={[r * 0.9, 48]} />
          <meshBasicMaterial color={color} transparent opacity={0.16} />
        </mesh>
      )}
      <group ref={inner}>
        <Model kind={s.kind} color={color} />
        {/* front marker so rotation is readable */}
        {selected && (
          <mesh position={[0, 0.04, r * 1.12]} rotation={[-Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.18, 0.4, 3]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        )}
      </group>
      <Html center position={[0, 3.35, 0]} distanceFactor={11} style={{ pointerEvents: 'none' }} zIndexRange={[20, 0]}>
        <div
          className={`flex items-center gap-2 whitespace-nowrap rounded-full border py-1 pl-1 pr-3 text-xs font-semibold shadow-lg backdrop-blur ${
            selected ? 'border-orange-300 bg-orange-500/95 text-white' : 'border-white/20 bg-black/65 text-white/90'
          }`}
        >
          {info?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={info.image} alt="" width={26} height={26} className="h-[26px] w-[26px] rounded-full object-cover" />
          ) : (
            <span className="h-[26px] w-[26px] rounded-full" style={{ background: color }} />
          )}
          <span className="max-w-[170px] truncate">{s.title}</span>
          {selected && info?.price ? <span className="font-bold">· {inr(info.price)}</span> : null}
        </div>
      </Html>
    </group>
  );
}

/* ─────────────── Guests ─────────────── */

function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Person = { ang: number; rad: number; sp: number; p: number; fx: number; fz: number; cx: number; cz: number; dance: boolean };

function Crowd({
  guests,
  b,
  stations,
  dance,
}: {
  guests: number;
  b: Bounds;
  stations: Station[];
  dance: { x: number; z: number } | null;
}) {
  const count = Math.min(220, Math.max(6, Math.round(guests / GUESTS_PER_DOT)));
  const bodies = useRef<THREE.InstancedMesh>(null!);
  const heads = useRef<THREE.InstancedMesh>(null!);
  const sref = useRef(stations);
  sref.current = stations;
  const dref = useRef(dance);
  dref.current = dance;
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const people = useMemo<Person[]>(() => {
    const rnd = mulberry32(guests * 7 + 13);
    return Array.from({ length: count }, (_, i) => {
      const fx = b.x0 + rnd() * (b.x1 - b.x0);
      const fz = b.z0 + rnd() * (b.z1 - b.z0);
      return { ang: rnd() * 6.28, rad: 1.6 + rnd() * 1.8, sp: 0.15 + rnd() * 0.35, p: rnd() * 6.28, fx, fz, cx: fx, cz: fz, dance: i % 3 === 0 };
    });
  }, [count, guests, b.x0, b.x1, b.z0, b.z1]);

  useLayoutEffect(() => {
    const palette = ['#c7d2fe', '#fda4af', '#fde68a', '#99f6e4', '#bae6fd', '#ddd6fe', '#fed7aa'].map((c) => new THREE.Color(c));
    const rnd = mulberry32(guests + 5);
    people.forEach((_, i) => {
      bodies.current.setColorAt(i, palette[Math.floor(rnd() * palette.length)]);
      heads.current.setColorAt(i, new THREE.Color('#f5d0b5').offsetHSL(0, 0, (rnd() - 0.5) * 0.18));
    });
    if (bodies.current.instanceColor) bodies.current.instanceColor.needsUpdate = true;
    if (heads.current.instanceColor) heads.current.instanceColor.needsUpdate = true;
  }, [people, guests]);

  useFrame((s, dt) => {
    const t = s.clock.elapsedTime;
    const st = sref.current;
    const dc = dref.current;
    people.forEach((p, i) => {
      // ~60% gather at stations, dancers gather at the dance floor, the rest mingle
      const anchor = st.length && i % 5 < 3 ? i % st.length : -1;
      let tx: number;
      let tz: number;
      let hopRate = 2.2;
      if (dc && p.dance && anchor < 0) {
        tx = dc.x + Math.cos(p.ang + t * 0.3) * (0.6 + (p.rad - 1.6) * 1.3);
        tz = dc.z + Math.sin(p.ang * 1.3 + t * 0.25) * (0.6 + (p.rad - 1.6) * 1.3);
        hopRate = 4.2;
      } else if (anchor >= 0) {
        const a = st[anchor];
        const ang = p.ang + t * p.sp * 0.35;
        const rr = KIND_RADIUS[a.kind] + 0.5 + (p.rad - 1.6) * 0.6;
        tx = a.x + Math.cos(ang) * rr;
        tz = a.z + Math.sin(ang) * rr;
      } else {
        tx = p.fx + Math.sin(t * p.sp + p.p) * 0.9;
        tz = p.fz + Math.cos(t * p.sp * 0.8 + p.p) * 0.9;
      }
      p.cx += (tx - p.cx) * Math.min(1, dt * 1.6);
      p.cz += (tz - p.cz) * Math.min(1, dt * 1.6);
      const hop = Math.abs(Math.sin(t * hopRate + p.p)) * 0.07;
      dummy.position.set(p.cx, 0.34 + hop, p.cz);
      dummy.rotation.set(0, Math.atan2(tx - p.cx, tz - p.cz), 0);
      dummy.updateMatrix();
      bodies.current.setMatrixAt(i, dummy.matrix);
      dummy.position.y = 0.9 + hop;
      dummy.updateMatrix();
      heads.current.setMatrixAt(i, dummy.matrix);
    });
    bodies.current.instanceMatrix.needsUpdate = true;
    heads.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group key={count}>
      <instancedMesh ref={bodies} args={[undefined, undefined, count]} frustumCulled={false}>
        <capsuleGeometry args={[0.17, 0.42, 4, 8]} />
        <meshStandardMaterial roughness={0.7} />
      </instancedMesh>
      <instancedMesh ref={heads} args={[undefined, undefined, count]} frustumCulled={false}>
        <sphereGeometry args={[0.15, 12, 12]} />
        <meshStandardMaterial roughness={0.6} />
      </instancedMesh>
    </group>
  );
}

/* ─────────────── Venue ─────────────── */

function useFloorTexture(cfg: VenueConfig, w: number, l: number) {
  const { venue, floor } = cfg;
  return useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 512;
    const g = c.getContext('2d')!;
    const rnd = mulberry32(7);
    if (venue === 'outdoor') {
      g.fillStyle = '#0f2a1e';
      g.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 5000; i++) {
        g.fillStyle = `rgba(${40 + rnd() * 40},${110 + rnd() * 70},${60 + rnd() * 40},${0.25 + rnd() * 0.35})`;
        g.fillRect(rnd() * 512, rnd() * 512, 2, 5);
      }
    } else if (floor === 'wood') {
      g.fillStyle = '#4a2f1b';
      g.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 8; i++) {
        g.fillStyle = `hsl(${24 + rnd() * 6},${42 + rnd() * 10}%,${22 + rnd() * 10}%)`;
        g.fillRect(0, i * 64, 512, 62);
        g.fillStyle = 'rgba(0,0,0,0.35)';
        g.fillRect(0, i * 64 + 62, 512, 2);
        for (let k = 0; k < 3; k++) g.fillRect(rnd() * 512, i * 64, 2, 62);
      }
    } else if (floor === 'carpet') {
      g.fillStyle = '#2a1650';
      g.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 9000; i++) {
        g.fillStyle = `rgba(${120 + rnd() * 60},${80 + rnd() * 40},${200 + rnd() * 50},${0.06 + rnd() * 0.1})`;
        g.fillRect(rnd() * 512, rnd() * 512, 2, 2);
      }
    } else if (floor === 'marble') {
      g.fillStyle = '#cfd5e6';
      g.fillRect(0, 0, 512, 512);
      for (let y = 0; y < 2; y++)
        for (let x = 0; x < 2; x++) {
          g.fillStyle = (x + y) % 2 ? '#d9deec' : '#c3cade';
          g.fillRect(x * 256, y * 256, 256, 256);
        }
      g.strokeStyle = 'rgba(90,100,140,0.25)';
      g.lineWidth = 1.5;
      for (let i = 0; i < 18; i++) {
        g.beginPath();
        g.moveTo(rnd() * 512, rnd() * 512);
        g.bezierCurveTo(rnd() * 512, rnd() * 512, rnd() * 512, rnd() * 512, rnd() * 512, rnd() * 512);
        g.stroke();
      }
    } else {
      g.fillStyle = '#0a0e2c';
      g.fillRect(0, 0, 512, 512);
      for (let y = 0; y < 8; y++)
        for (let x = 0; x < 8; x++) {
          g.fillStyle = (x + y) % 2 ? '#10153a' : '#0c1131';
          g.fillRect(x * 64, y * 64, 64, 64);
        }
      g.strokeStyle = 'rgba(251,146,60,0.18)';
      g.lineWidth = 2;
      for (let i = 0; i <= 8; i++) {
        g.beginPath();
        g.moveTo(i * 64, 0);
        g.lineTo(i * 64, 512);
        g.moveTo(0, i * 64);
        g.lineTo(512, i * 64);
        g.stroke();
      }
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(w / 8, l / 8);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }, [venue, floor, w, l]);
}

function useImage(url: string | null) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!url) {
      setImg(null);
      return;
    }
    const i = new Image();
    i.onload = () => setImg(i);
    i.onerror = () => setImg(null);
    i.src = url;
  }, [url]);
  return img;
}

function useTitleTexture(title: string, subtitle: string, theme: LightTheme, aspect: number, logo: HTMLImageElement | null) {
  return useMemo(() => {
    if (!title.trim() && !subtitle.trim() && !logo) return null;
    const W = 1024;
    const H = Math.max(160, Math.round(W / aspect));
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d')!;
    const cols = THEMES[theme].colors;
    const grad = g.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#0a0e2c');
    grad.addColorStop(0.5, '#151a4a');
    grad.addColorStop(1, '#0a0e2c');
    g.fillStyle = grad;
    g.fillRect(0, 0, W, H);
    g.strokeStyle = cols[0];
    g.lineWidth = 6;
    g.strokeRect(14, 14, W - 28, H - 28);
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    const hasText = !!(title.trim() || subtitle.trim());
    // company logo on a soft white plate, centred above the text (or large on its own)
    if (logo) {
      const maxH = hasText ? H * 0.38 : H * 0.7;
      const maxW = W * 0.5;
      const k = Math.min(maxW / logo.width, maxH / logo.height);
      const lw = logo.width * k;
      const lh = logo.height * k;
      const ly = hasText ? H * 0.08 : (H - lh) / 2;
      g.fillStyle = 'rgba(255,255,255,0.92)';
      const px = 18;
      g.beginPath();
      g.roundRect ? g.roundRect((W - lw) / 2 - px, ly - 10, lw + px * 2, lh + 20, 18) : g.rect((W - lw) / 2 - px, ly - 10, lw + px * 2, lh + 20);
      g.fill();
      g.drawImage(logo, (W - lw) / 2, ly, lw, lh);
    }
    if (hasText) {
      const top = logo ? 0.64 : 0.42;
      const subY = logo ? 0.88 : 0.74;
      let size = Math.round(H * (logo ? 0.22 : 0.34));
      g.font = `800 ${size}px Arial, Helvetica, sans-serif`;
      while (g.measureText(title).width > W * 0.86 && size > 24) {
        size -= 4;
        g.font = `800 ${size}px Arial, Helvetica, sans-serif`;
      }
      g.shadowColor = cols[1];
      g.shadowBlur = 24;
      g.fillStyle = '#ffffff';
      if (title.trim()) g.fillText(title.trim(), W / 2, subtitle.trim() ? H * top : H * (logo ? 0.76 : 0.5));
      g.shadowBlur = 0;
      if (subtitle.trim()) {
        let sz = Math.round(H * (logo ? 0.1 : 0.15));
        g.font = `600 ${sz}px Arial, Helvetica, sans-serif`;
        while (g.measureText(subtitle).width > W * 0.82 && sz > 14) {
          sz -= 2;
          g.font = `600 ${sz}px Arial, Helvetica, sans-serif`;
        }
        g.fillStyle = cols[2];
        g.fillText(subtitle.trim(), W / 2, H * subY);
      }
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }, [title, subtitle, theme, aspect, logo]);
}

function Stage({
  rect,
  venue,
  theme,
  title,
  subtitle,
  logo,
  label,
}: {
  rect: StageRect;
  venue: Venue;
  theme: LightTheme;
  title: string;
  subtitle: string;
  logo: HTMLImageElement | null;
  label?: string;
}) {
  const screen = useRef<THREE.MeshBasicMaterial>(null!);
  const titleTex = useTitleTexture(title, subtitle, theme, (rect.sw * 0.92) / 3.8, logo);
  const hueBase = useMemo(() => new THREE.Color(THEMES[theme].colors[0]).getHSL({ h: 0, s: 0, l: 0 }).h, [theme]);
  useFrame((s) => {
    if (titleTex) {
      screen.current.color.setRGB(1, 1, 1);
      return;
    }
    if (theme === 'white') screen.current.color.setHSL(0.6, 0.1, 0.8 + Math.sin(s.clock.elapsedTime) * 0.08);
    else if (theme === 'rgb') screen.current.color.setHSL((s.clock.elapsedTime * 0.08) % 1, 0.85, 0.5);
    else screen.current.color.setHSL((hueBase + Math.sin(s.clock.elapsedTime * 0.35) * 0.08 + 1) % 1, 0.8, 0.5);
  });
  const { sw: w, sd: d } = rect;
  const c = THEMES[theme].colors;
  return (
    <group position={[rect.cx, 0, rect.cz]} rotation={[0, rect.rot, 0]}>
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[w, 0.5, d]} />
        <meshStandardMaterial color="#141a45" roughness={0.4} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.51, d / 2 - 0.01]}>
        <boxGeometry args={[w, 0.04, 0.04]} />
        <Glow color={c[1]} i={2} />
      </mesh>
      <mesh position={[0, 2.5, -d / 2 + 0.2]}>
        <planeGeometry args={[w * 0.92, 3.8]} />
        <meshBasicMaterial ref={screen} map={titleTex || null} key={titleTex ? 'tex' : 'plain'} />
      </mesh>
      <mesh position={[0, 4.45, -d / 2 + 0.3]}>
        <boxGeometry args={[w, 0.16, 0.2]} />
        <meshStandardMaterial color={steel} metalness={0.8} roughness={0.3} />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * (w / 2 - 0.5), 1.3, 0]}>
            <boxGeometry args={[0.9, 1.6, 0.8]} />
            <meshStandardMaterial color="#0b0f25" roughness={0.5} />
          </mesh>
          <mesh position={[s * (w / 2 - 0.5), 1.55, 0.41]}>
            <circleGeometry args={[0.28, 20]} />
            <meshBasicMaterial color={c[2]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 1.0, 0.4]}>
        <boxGeometry args={[2.2, 0.8, 0.9]} />
        <meshStandardMaterial color="#0b0f25" roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh position={[0, 1.42, 0.4]}>
        <boxGeometry args={[1.8, 0.04, 0.6]} />
        <Glow color={c[0]} i={1.6} />
      </mesh>
      <Html center position={[0, 5.2, -d / 2 + 0.3]} distanceFactor={14} style={{ pointerEvents: 'none' }}>
        <div className="rounded-full border border-white/20 bg-black/50 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white/80">
          {label || (venue === 'indoor' ? 'Main stage' : 'Open-air stage')}
        </div>
      </Html>
    </group>
  );
}

function Walls({ w, l, theme, stage, wallColor }: { w: number; l: number; theme: LightTheme; stage: StageSide; wallColor: WallColor }) {
  const h = 5;
  const c = THEMES[theme].colors;
  const wall = WALL_COLORS[wallColor].hex;
  const mat = <meshStandardMaterial color={wall} roughness={0.8} metalness={0.2} />;
  const pz = Math.max(2, Math.round(l / 5));
  const px = Math.max(2, Math.round(w / 5));
  return (
    <group>
      {/* inward-facing only (back-face culled) so the room is never hidden from outside */}
      <mesh position={[0, h / 2, -l / 2]}>
        <planeGeometry args={[w, h]} />
        {mat}
      </mesh>
      <mesh position={[-w / 2, h / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[l, h]} />
        {mat}
      </mesh>
      <mesh position={[w / 2, h / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[l, h]} />
        {mat}
      </mesh>
      {[-w / 2, w / 2].map((x) => (
        <group key={x}>
          <mesh position={[x + (x < 0 ? 0.04 : -0.04), 0.15, 0]}>
            <boxGeometry args={[0.05, 0.1, l]} />
            <Glow color={c[1]} i={1.8} />
          </mesh>
          <mesh position={[x + (x < 0 ? 0.04 : -0.04), 4.6, 0]}>
            <boxGeometry args={[0.05, 0.08, l]} />
            <Glow color={c[0]} i={1.8} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 4.6, -l / 2 + 0.04]}>
        <boxGeometry args={[w, 0.08, 0.05]} />
        <Glow color={c[0]} i={1.8} />
      </mesh>
      {/* wall posters on side walls (skipped on the stage side) */}
      {Array.from({ length: pz }).map((_, i) => {
        const z = -l / 2 + ((i + 0.5) * l) / pz;
        const col = c[i % 4];
        return (
          <group key={i}>
            {stage !== 'left' && (
              <mesh position={[-w / 2 + 0.05, 2.5, z]} rotation={[0, Math.PI / 2, 0]}>
                <planeGeometry args={[1.8, 2.4]} />
                <meshStandardMaterial color={col} emissive={col} emissiveIntensity={0.35} />
              </mesh>
            )}
            {stage !== 'right' && (
              <mesh position={[w / 2 - 0.05, 2.5, z]} rotation={[0, -Math.PI / 2, 0]}>
                <planeGeometry args={[1.8, 2.4]} />
                <meshStandardMaterial color={col} emissive={col} emissiveIntensity={0.35} />
              </mesh>
            )}
          </group>
        );
      })}
      {stage !== 'back' &&
        Array.from({ length: px }).map((_, i) => {
          const x = -w / 2 + ((i + 0.5) * w) / px;
          const col = c[(i + 1) % 4];
          return (
            <mesh key={`b${i}`} position={[x, 2.5, -l / 2 + 0.05]}>
              <planeGeometry args={[1.8, 2.4]} />
              <meshStandardMaterial color={col} emissive={col} emissiveIntensity={0.35} />
            </mesh>
          );
        })}
    </group>
  );
}

function Pendants({ w, l, theme, bright }: { w: number; l: number; theme: LightTheme; bright: number }) {
  const cols = THEMES[theme].colors;
  const beams = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return { x: Math.cos(a) * w * 0.32, z: Math.sin(a) * l * 0.32, c: cols[i % 4] };
      }),
    [w, l, cols]
  );
  const group = useRef<THREE.Group>(null!);
  useFrame((s) => {
    group.current.children.forEach((ch, i) => {
      ch.rotation.x = Math.sin(s.clock.elapsedTime * 0.6 + i) * 0.18;
      ch.rotation.z = Math.cos(s.clock.elapsedTime * 0.5 + i * 1.7) * 0.18;
    });
  });
  return (
    <group ref={group}>
      {beams.map((b, i) => (
        <group key={i} position={[b.x, 5.6, b.z]}>
          <mesh position={[0, -1.9, 0]}>
            <coneGeometry args={[1.0, 3.8, 20, 1, true]} />
            <meshBasicMaterial color={b.c} transparent opacity={0.07 * bright} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.15, 10, 10]} />
            <Glow color={b.c} i={2} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Seating({ cfg, w, l, guests }: { cfg: VenueConfig; w: number; l: number; guests: number }) {
  const seats = seatCount(cfg, guests);
  const stage = stageRect(cfg, w, l);
  const theatre = useMemo(() => theatreSeats(cfg, w, l, guests), [cfg, w, l, guests]);
  const accent = THEMES[cfg.theme].colors[0];

  // banquet tables / lounge sofas go along the free side walls
  const spots = useMemo(() => {
    if (cfg.seating !== 'tables' && cfg.seating !== 'lounge') return [];
    const per = cfg.seating === 'tables' ? cfg.tableSeats : 5;
    const n = Math.min(cfg.seating === 'tables' ? 14 : 10, Math.max(1, Math.ceil(seats / per)));
    const blocked = (sd: number) => (cfg.stage === 'left' && sd === -1) || (cfg.stage === 'right' && sd === 1) || (stage2Rect(cfg, w, l) && ((cfg.stage2 === 'left' && sd === -1) || (cfg.stage2 === 'right' && sd === 1)));
    const free = [-1, 1].filter((sd) => !blocked(sd));
    const sides = free.length ? free : [-1];
    const zStart = (cfg.stage === 'back' ? -l / 2 + (stage ? stage.sd : 0) + 2 : -l / 2 + 2.2) + 1.4;
    const zEnd = l / 2 - (cfg.bar ? 8.5 : 2.6);
    const out: { x: number; z: number }[] = [];
    for (let i = 0; i < n; i++) {
      const sd = sides[i % sides.length];
      const idx = Math.floor(i / sides.length);
      const cnt = Math.ceil(n / sides.length);
      const z = zStart + (cnt === 1 ? (zEnd - zStart) / 2 : (idx * (zEnd - zStart)) / (cnt - 1));
      out.push({ x: sd * (w / 2 - 1.4), z });
    }
    return out;
  }, [cfg, seats, w, l, stage]);

  const seatRef = useRef<THREE.InstancedMesh>(null!);
  const backRef = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useLayoutEffect(() => {
    if (!seatRef.current || !backRef.current) return;
    theatre.chairs.forEach((c, i) => {
      dummy.position.set(c.x, 0.42, c.z);
      dummy.rotation.set(0, c.rot, 0);
      dummy.updateMatrix();
      seatRef.current.setMatrixAt(i, dummy.matrix);
      // backrest sits behind the seat, away from the stage
      dummy.position.set(c.x + Math.sin(c.rot) * 0.17, 0.7, c.z + Math.cos(c.rot) * 0.17);
      dummy.updateMatrix();
      backRef.current.setMatrixAt(i, dummy.matrix);
    });
    seatRef.current.instanceMatrix.needsUpdate = true;
    backRef.current.instanceMatrix.needsUpdate = true;
  }, [theatre, dummy]);

  if (cfg.seating === 'theatre' && theatre.chairs.length) {
    return (
      <group key={theatre.chairs.length}>
        <instancedMesh ref={seatRef} args={[undefined, undefined, theatre.chairs.length]}>
          <boxGeometry args={[0.46, 0.08, 0.44]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.6} />
        </instancedMesh>
        <instancedMesh ref={backRef} args={[undefined, undefined, theatre.chairs.length]}>
          <boxGeometry args={[0.46, 0.5, 0.06]} />
          <meshStandardMaterial color={accent} roughness={0.6} />
        </instancedMesh>
      </group>
    );
  }

  if (cfg.seating === 'lounge') {
    return (
      <group>
        {spots.map((t, i) => {
          const toward = t.x < 0 ? Math.PI / 2 : -Math.PI / 2; // face the room
          return (
            <group key={i} position={[t.x, 0, t.z]} rotation={[0, toward, 0]}>
              <mesh position={[0, 0.25, 0]}>
                <boxGeometry args={[2.2, 0.5, 0.9]} />
                <meshStandardMaterial color="#312e81" roughness={0.8} />
              </mesh>
              <mesh position={[0, 0.65, -0.38]}>
                <boxGeometry args={[2.2, 0.5, 0.18]} />
                <meshStandardMaterial color="#4338ca" roughness={0.8} />
              </mesh>
              <mesh position={[0, 0.22, 1.2]}>
                <cylinderGeometry args={[0.45, 0.45, 0.44, 20]} />
                <meshStandardMaterial color="#e2e8f0" roughness={0.4} />
              </mesh>
              <mesh position={[0, 0.46, 1.2]}>
                <sphereGeometry args={[0.07, 10, 10]} />
                <Glow color={accent} i={1.6} />
              </mesh>
            </group>
          );
        })}
      </group>
    );
  }

  return (
    <group>
      {spots.map((t, i) => (
        <group key={i} position={[t.x, 0, t.z]}>
          <mesh position={[0, 0.7, 0]}>
            <cylinderGeometry args={[0.4 + cfg.tableSeats * 0.05, 0.4 + cfg.tableSeats * 0.05, 0.06, 24]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.35, 0]}>
            <cylinderGeometry args={[0.06, 0.1, 0.7, 10]} />
            <Body color={steel} metal={0.7} />
          </mesh>
          <mesh position={[0, 0.78, 0]}>
            <sphereGeometry args={[0.08, 10, 10]} />
            <Glow color="#fde047" i={1.5} />
          </mesh>
          {Array.from({ length: cfg.tableSeats }).map((_, k) => {
            const a = (k / cfg.tableSeats) * Math.PI * 2 + 0.4;
            const rr = 0.8 + cfg.tableSeats * 0.05;
            return (
              <mesh key={k} position={[Math.cos(a) * rr, 0.25, Math.sin(a) * rr]}>
                <cylinderGeometry args={[0.21, 0.21, 0.5, 14]} />
                <meshStandardMaterial color={accent} roughness={0.6} />
              </mesh>
            );
          })}
        </group>
      ))}
    </group>
  );
}

function LogoPanel({ logo }: { logo: HTMLImageElement }) {
  const tex = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 512;
    const g = c.getContext('2d')!;
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, 512, 512);
    const k = Math.min(440 / logo.width, 440 / logo.height);
    g.drawImage(logo, (512 - logo.width * k) / 2, (512 - logo.height * k) / 2, logo.width * k, logo.height * k);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [logo]);
  return (
    <mesh position={[0, 1.45, 0.06]}>
      <planeGeometry args={[2.6, 2.6]} />
      <meshBasicMaterial map={tex} />
    </mesh>
  );
}

function Extras({ cfg, w, l, logo }: { cfg: VenueConfig; w: number; l: number; logo: HTMLImageElement | null }) {
  const c = THEMES[cfg.theme].colors;
  const stage = stageRect(cfg, w, l);
  const tiles = useRef<THREE.Group>(null!);
  useFrame((s) => {
    if (!tiles.current) return;
    tiles.current.children.forEach((m, i) => {
      const mat = (m as THREE.Mesh).material as THREE.MeshStandardMaterial;
      const k = (Math.sin(s.clock.elapsedTime * 2 + i * 0.9) + 1) / 2;
      mat.emissiveIntensity = 0.25 + k * 1.1;
    });
  });

  // dance floor sits right in front of the stage
  let dance: { x: number; z: number } | null = null;
  if (cfg.dance) {
    const off = (stage ? stage.sd : 0) + 1.6 + 3.2;
    if (cfg.stage === 'left') dance = { x: -w / 2 + off, z: 0 };
    else if (cfg.stage === 'right') dance = { x: w / 2 - off, z: 0 };
    else dance = { x: 0, z: -l / 2 + off };
  }
  const barSide = -1; // front-left corner
  return (
    <group>
      {dance && (
        <group ref={tiles} position={[dance.x, 0.03, dance.z]}>
          {Array.from({ length: 16 }).map((_, i) => {
            const col = c[(Math.floor(i / 4) + (i % 4)) % 4];
            return (
              <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[((i % 4) - 1.5) * 1.4, 0, (Math.floor(i / 4) - 1.5) * 1.4]}>
                <planeGeometry args={[1.32, 1.32]} />
                <meshStandardMaterial color={col} emissive={col} emissiveIntensity={0.5} roughness={0.3} />
              </mesh>
            );
          })}
        </group>
      )}
      {cfg.bar && (
        <group position={[barSide * (w / 2 - 0.9), 0, l / 2 - 4.4]} rotation={[0, Math.PI / 2, 0]}>
          <mesh position={[0, 0.55, 0]}>
            <boxGeometry args={[6, 1.1, 0.8]} />
            <meshStandardMaterial color="#1b1f45" roughness={0.4} metalness={0.4} />
          </mesh>
          <mesh position={[0, 1.12, 0]}>
            <boxGeometry args={[6.1, 0.06, 0.9]} />
            <Glow color={c[1]} i={1.8} />
          </mesh>
          <mesh position={[0, 1.7, -0.5]}>
            <boxGeometry args={[5.6, 1.2, 0.12]} />
            <meshStandardMaterial color="#0b0f25" roughness={0.5} />
          </mesh>
          {Array.from({ length: 9 }).map((_, i) => (
            <mesh key={i} position={[(i - 4) * 0.6, 1.5 + (i % 2) * 0.35, -0.42]}>
              <cylinderGeometry args={[0.07, 0.09, 0.4, 10]} />
              <meshStandardMaterial color={c[i % 4]} emissive={c[i % 4]} emissiveIntensity={0.6} transparent opacity={0.85} />
            </mesh>
          ))}
          {[-2.2, -0.7, 0.8, 2.3].map((x) => (
            <mesh key={x} position={[x, 0.38, 0.85]}>
              <cylinderGeometry args={[0.2, 0.2, 0.76, 14]} />
              <meshStandardMaterial color="#e2e8f0" roughness={0.5} />
            </mesh>
          ))}
        </group>
      )}
      {cfg.photoWall && (
        <group position={[w / 2 - 0.5, 0, l / 2 - 6]} rotation={[0, -Math.PI / 2, 0]}>
          <mesh position={[0, 1.4, 0]}>
            <boxGeometry args={[4.4, 2.8, 0.1]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.6} />
          </mesh>
          {logo && <LogoPanel logo={logo} />}
          {!logo && Array.from({ length: 6 }).map((_, i) => (
            <mesh key={i} position={[((i % 3) - 1) * 1.3, 0.9 + Math.floor(i / 3) * 1.1, 0.06]}>
              <planeGeometry args={[0.9, 0.5]} />
              <meshBasicMaterial color={c[i % 4]} />
            </mesh>
          ))}
          {[-2.2, 2.2].map((x) => (
            <mesh key={x} position={[x, 1.4, 0.04]}>
              <boxGeometry args={[0.08, 2.9, 0.1]} />
              <Glow color={c[0]} i={1.6} />
            </mesh>
          ))}
          <mesh position={[0, 0.03, 1.6]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[3, 2]} />
            <meshStandardMaterial color={c[2]} emissive={c[2]} emissiveIntensity={0.3} transparent opacity={0.5} />
          </mesh>
        </group>
      )}
    </group>
  );
}

function Screens({ cfg, w, l }: { cfg: VenueConfig; w: number; l: number }) {
  const a = useRef<THREE.MeshBasicMaterial>(null!);
  const b = useRef<THREE.MeshBasicMaterial>(null!);
  const c = THEMES[cfg.theme].colors;
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    a.current.color.set(c[Math.floor(t / 3) % 4]).multiplyScalar(0.55 + Math.sin(t * 2) * 0.12);
    b.current.color.set(c[(Math.floor(t / 3) + 2) % 4]).multiplyScalar(0.55 + Math.cos(t * 2) * 0.12);
  });
  const onBack = cfg.stage === 'left' || cfg.stage === 'right';
  const screens = onBack
    ? [
        { pos: [-w * 0.24, 3.0, -l / 2 + 0.06] as [number, number, number], rot: 0, m: a },
        { pos: [w * 0.24, 3.0, -l / 2 + 0.06] as [number, number, number], rot: 0, m: b },
      ]
    : [
        { pos: [-w / 2 + 0.06, 3.0, l * 0.12] as [number, number, number], rot: Math.PI / 2, m: a },
        { pos: [w / 2 - 0.06, 3.0, l * 0.12] as [number, number, number], rot: -Math.PI / 2, m: b },
      ];
  return (
    <group>
      {screens.map((s, i) => (
        <group key={i} position={s.pos} rotation={[0, s.rot, 0]}>
          <mesh>
            <planeGeometry args={[4.2, 2.3]} />
            <meshBasicMaterial ref={s.m} />
          </mesh>
          <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[4.4, 2.5]} />
            <meshBasicMaterial color="#05071a" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function OutdoorPoles({ w, l, theme }: { w: number; l: number; theme: LightTheme }) {
  const c = THEMES[theme].colors;
  const pts = useMemo(() => {
    const nx = Math.max(3, Math.round(w / 5));
    const nz = Math.max(3, Math.round(l / 5));
    const out: [number, number][] = [];
    for (let i = 0; i <= nx; i++) out.push([(i / nx - 0.5) * w, -l / 2], [(i / nx - 0.5) * w, l / 2]);
    for (let i = 1; i < nz; i++) out.push([-w / 2, (i / nz - 0.5) * l], [w / 2, (i / nz - 0.5) * l]);
    return out;
  }, [w, l]);
  return (
    <group>
      {pts.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 1.6, 0]}>
            <cylinderGeometry args={[0.04, 0.05, 3.2, 8]} />
            <Body color={steel} metal={0.6} />
          </mesh>
          <mesh position={[0, 3.25, 0]}>
            <sphereGeometry args={[0.14, 12, 12]} />
            <Glow color={c[i % 4]} i={2.4} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Entrance({ style, l, colors }: { style: EntranceStyle; l: number; colors: string[] }) {
  const ref = useRef<THREE.Group>(null!);
  const pts = useMemo(() => {
    if (style === 'neon') return [] as { x: number; y: number; r: number; c: string }[];
    const rnd = mulberry32(style === 'floral' ? 11 : 23);
    const arr: { x: number; y: number; r: number; c: string }[] = [];
    const pal = style === 'floral' ? ['#f9a8d4', '#fde68a', '#fef3c7', '#86efac', '#fda4af'] : colors;
    for (let i = 0; i <= 26; i++) {
      const a = Math.PI * (i / 26);
      const x = -Math.cos(a) * 1.8;
      const y = 1.5 + Math.sin(a) * 1.3;
      arr.push({ x: x + (rnd() - 0.5) * 0.15, y: y + (rnd() - 0.5) * 0.15, r: style === 'floral' ? 0.17 + rnd() * 0.08 : 0.26 + rnd() * 0.06, c: pal[Math.floor(rnd() * pal.length)] });
    }
    for (const sx of [-1.8, 1.8])
      for (let j = 0; j < 7; j++)
        arr.push({ x: sx + (rnd() - 0.5) * 0.2, y: 0.2 + j * 0.24, r: style === 'floral' ? 0.15 + rnd() * 0.07 : 0.24 + rnd() * 0.05, c: pal[Math.floor(rnd() * pal.length)] });
    return arr;
  }, [style, colors]);
  useFrame((s) => {
    if (style === 'balloon' && ref.current) ref.current.position.y = Math.sin(s.clock.elapsedTime * 1.2) * 0.03;
  });
  return (
    <group position={[0, 0, l / 2 - 0.15]}>
      {style === 'neon' ? (
        <>
          {[-1.7, 1.7].map((x) => (
            <mesh key={x} position={[x, 1.3, 0]}>
              <boxGeometry args={[0.2, 2.6, 0.2]} />
              <Glow color={colors[0]} i={1.4} />
            </mesh>
          ))}
          <mesh position={[0, 2.6, 0]}>
            <boxGeometry args={[3.6, 0.2, 0.2]} />
            <Glow color={colors[0]} i={1.4} />
          </mesh>
        </>
      ) : (
        <group ref={ref}>
          {style === 'floral' && (
            <mesh position={[0, 2.8, 0]}>
              <torusGeometry args={[1.8, 0.05, 8, 40, Math.PI]} />
              <meshStandardMaterial color="#166534" roughness={0.8} />
            </mesh>
          )}
          {pts.map((p, i) => (
            <mesh key={i} position={[p.x, p.y + (style === 'floral' ? 0 : 0.3), 0]}>
              <sphereGeometry args={[p.r, 12, 12]} />
              <meshStandardMaterial color={p.c} roughness={style === 'floral' ? 0.8 : 0.25} emissive={p.c} emissiveIntensity={style === 'floral' ? 0.12 : 0.18} />
            </mesh>
          ))}
        </group>
      )}
      <Html center position={[0, 3.6, 0]} distanceFactor={12} style={{ pointerEvents: 'none' }}>
        <div className="rounded-full border border-violet-300/40 bg-violet-600/70 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white">
          Entrance
        </div>
      </Html>
    </group>
  );
}

function FairyLights({ w, l, high }: { w: number; l: number; high: number }) {
  const strands = Math.max(3, Math.floor(l / 3.6));
  const per = Math.max(14, Math.floor(w * 1.4));
  const count = strands * per;
  const ref = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useLayoutEffect(() => {
    let i = 0;
    for (let j = 0; j < strands; j++) {
      const z = -l / 2 + ((j + 1) * l) / (strands + 1);
      for (let k = 0; k < per; k++) {
        const t = k / (per - 1);
        dummy.position.set(-w / 2 + 0.4 + t * (w - 0.8), high - Math.sin(Math.PI * t) * 0.55, z);
        dummy.scale.setScalar(0.8 + ((i * 37) % 5) * 0.1);
        dummy.updateMatrix();
        ref.current.setMatrixAt(i++, dummy.matrix);
      }
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, [strands, per, w, l, high, dummy]);
  useFrame((s) => {
    const m = ref.current.material as THREE.MeshBasicMaterial;
    m.color.setHSL(0.11, 0.9, 0.62 + Math.sin(s.clock.elapsedTime * 3) * 0.06);
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} key={count} frustumCulled={false}>
      <sphereGeometry args={[0.07, 8, 8]} />
      <meshBasicMaterial color="#fde68a" />
    </instancedMesh>
  );
}

function Balloons({ w, l, stage, colors }: { w: number; l: number; stage: StageRect | null; colors: string[] }) {
  const group = useRef<THREE.Group>(null!);
  const clusters = useMemo(() => {
    const spots: [number, number][] = stage
      ? stage.rot === 0
        ? [
            [-stage.sw / 2 - 0.9, stage.cz + stage.sd / 2 + 0.6],
            [stage.sw / 2 + 0.9, stage.cz + stage.sd / 2 + 0.6],
          ]
        : [
            [stage.cx + Math.sign(stage.cx) * -(stage.sd / 2 + 0.6), -stage.sw / 2 - 0.9],
            [stage.cx + Math.sign(stage.cx) * -(stage.sd / 2 + 0.6), stage.sw / 2 + 0.9],
          ]
      : [[-w / 2 + 1.6, -l / 2 + 1.6], [w / 2 - 1.6, -l / 2 + 1.6]];
    spots.push([-w / 2 + 1.4, l / 2 - 1.6], [w / 2 - 1.4, l / 2 - 1.6]);
    const rnd = mulberry32(5);
    return spots.map(([x, z]) => ({
      x,
      z,
      b: Array.from({ length: 8 }, (_, i) => ({ dx: (rnd() - 0.5) * 0.9, dz: (rnd() - 0.5) * 0.9, h: 1.7 + rnd() * 1.1, c: colors[i % colors.length] })),
    }));
  }, [w, l, stage, colors]);
  useFrame((s) => {
    group.current.children.forEach((g, i) => (g.position.y = Math.sin(s.clock.elapsedTime * 0.9 + i) * 0.06));
  });
  return (
    <group ref={group}>
      {clusters.map((cl, i) => (
        <group key={i} position={[cl.x, 0, cl.z]}>
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.25, 0.3, 0.4, 14]} />
            <Body color="#334155" />
          </mesh>
          {cl.b.map((b, k) => (
            <group key={k}>
              <mesh position={[b.dx, b.h, b.dz]}>
                <sphereGeometry args={[0.3, 14, 14]} />
                <meshStandardMaterial color={b.c} roughness={0.2} metalness={0.1} emissive={b.c} emissiveIntensity={0.15} />
              </mesh>
              <mesh position={[b.dx / 2, b.h / 2 - 0.1, b.dz / 2]}>
                <cylinderGeometry args={[0.005, 0.005, b.h - 0.3, 4]} />
                <meshBasicMaterial color="#e2e8f0" />
              </mesh>
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}

function WelcomeDesk({ w, l, colors }: { w: number; l: number; colors: string[] }) {
  return (
    <group position={[-Math.min(4.2, w * 0.28), 0, l / 2 - 1.5]}>
      <mesh position={[0, 0.52, 0]}>
        <boxGeometry args={[2.6, 1.04, 0.7]} />
        <meshStandardMaterial color="#1b1f45" roughness={0.4} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.55, 0.36]}>
        <planeGeometry args={[2.3, 0.7]} />
        <meshBasicMaterial color={colors[0]} />
      </mesh>
      <mesh position={[0, 1.07, 0]}>
        <boxGeometry args={[2.7, 0.06, 0.8]} />
        <Glow color={colors[1]} i={1.6} />
      </mesh>
      <mesh position={[1.9, 1.05, 0]}>
        <boxGeometry args={[0.9, 2.1, 0.06]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.5} />
      </mesh>
      <mesh position={[1.9, 1.35, 0.04]}>
        <planeGeometry args={[0.7, 0.9]} />
        <meshBasicMaterial color={colors[2]} />
      </mesh>
      <Html center position={[0, 2.0, 0]} distanceFactor={12} style={{ pointerEvents: 'none' }}>
        <div className="rounded-full border border-white/20 bg-black/55 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white/85">Welcome desk</div>
      </Html>
    </group>
  );
}

function Runway({ rect, colors }: { rect: StageRect; colors: string[] }) {
  const lights = useRef<THREE.Group>(null!);
  useFrame((s) => {
    lights.current.children.forEach((m, i) => {
      const mat = (m as THREE.Mesh).material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.6 + (Math.sin(s.clock.elapsedTime * 3 - i * 0.7) + 1) * 0.7;
    });
  });
  const len = RUNWAY_LEN;
  return (
    <group position={[rect.cx, 0, rect.cz]} rotation={[0, rect.rot, 0]}>
      <group position={[0, 0, rect.sd / 2]}>
        <mesh position={[0, 0.22, len / 2]}>
          <boxGeometry args={[1.8, 0.44, len]} />
          <meshStandardMaterial color="#141a45" roughness={0.35} metalness={0.45} />
        </mesh>
        <mesh position={[0, 0.22, len + 0.7]}>
          <boxGeometry args={[4.6, 0.44, 1.4]} />
          <meshStandardMaterial color="#141a45" roughness={0.35} metalness={0.45} />
        </mesh>
        <group ref={lights}>
          {Array.from({ length: 12 }).map((_, i) => {
            const side = i % 2 ? 1 : -1;
            return (
              <mesh key={i} position={[side * 0.92, 0.46, 0.4 + Math.floor(i / 2) * ((len - 0.4) / 5.5)]}>
                <boxGeometry args={[0.06, 0.04, 0.5]} />
                <meshStandardMaterial color={colors[i % 4]} emissive={colors[i % 4]} emissiveIntensity={1} />
              </mesh>
            );
          })}
        </group>
      </group>
    </group>
  );
}

function VenueShell({ cfg, w, l, guests, logo }: { cfg: VenueConfig; w: number; l: number; guests: number; logo: HTMLImageElement | null }) {
  const floor = useFloorTexture(cfg, w, l);
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(w, 0.2, l)), [w, l]);
  const c = THEMES[cfg.theme].colors;
  const stage = stageRect(cfg, w, l);
  const stage2 = stage2Rect(cfg, w, l);
  const indoor = cfg.venue === 'indoor';
  return (
    <group>
      <mesh position={[0, -0.1, 0]}>
        <boxGeometry args={[w, 0.2, l]} />
        <meshStandardMaterial
          map={floor}
          roughness={!indoor ? 0.95 : cfg.floor === 'marble' ? 0.15 : cfg.floor === 'dark' ? 0.3 : 0.7}
          metalness={!indoor ? 0 : cfg.floor === 'dark' ? 0.55 : cfg.floor === 'marble' ? 0.3 : 0.05}
        />
      </mesh>
      <lineSegments position={[0, -0.1, 0]} geometry={edges}>
        <lineBasicMaterial color={c[1]} />
      </lineSegments>
      {/* entrance runner */}
      {cfg.carpet !== 'none' && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, cfg.carpet === 'red' ? l / 2 - Math.min(l * 0.3, 9) : l / 2 - 3]}>
          <planeGeometry args={[cfg.carpet === 'red' ? 2.6 : 2.2, cfg.carpet === 'red' ? Math.min(l * 0.6, 18) : 6]} />
          {cfg.carpet === 'red' ? (
            <meshStandardMaterial color="#b91c1c" emissive="#7f1d1d" emissiveIntensity={0.25} roughness={0.9} />
          ) : (
            <meshStandardMaterial color={c[0]} emissive={c[0]} emissiveIntensity={0.2} roughness={0.9} transparent opacity={0.5} />
          )}
        </mesh>
      )}
      {indoor ? <Walls w={w} l={l} theme={cfg.theme} stage={cfg.stage} wallColor={cfg.wall} /> : <OutdoorPoles w={w} l={l} theme={cfg.theme} />}
      {indoor && cfg.beams && <Pendants w={w} l={l} theme={cfg.theme} bright={cfg.bright} />}
      {stage && <Stage rect={stage} venue={cfg.venue} theme={cfg.theme} title={cfg.title} subtitle={cfg.subtitle} logo={logo} />}
      {stage && cfg.runway && <Runway rect={stage} colors={c} />}
      {stage2 && <Stage rect={stage2} venue={cfg.venue} theme={cfg.theme} title="" subtitle="" logo={null} label="Second stage" />}
      <Seating cfg={cfg} w={w} l={l} guests={guests} />
      <Extras cfg={cfg} w={w} l={l} logo={logo} />
      {cfg.screens && indoor && <Screens cfg={cfg} w={w} l={l} />}
      {cfg.welcome && <WelcomeDesk w={w} l={l} colors={c} />}
      {cfg.fairy && <FairyLights w={w} l={l} high={indoor ? 4.5 : 3.3} />}
      {cfg.balloons && <Balloons w={w} l={l} stage={stage} colors={c} />}
      <Entrance style={cfg.entrance} l={l} colors={c} />
    </group>
  );
}

/* ─────────────── Camera rig: presets + guided tour ─────────────── */

function Rig({
  view,
  stations,
  w,
  l,
  onTourStep,
  onFree,
  apiRef,
}: {
  view: ViewCmd;
  stations: Station[];
  w: number;
  l: number;
  onTourStep: (uid: string | null) => void;
  onFree: () => void;
  apiRef: React.MutableRefObject<PlannerApi | null>;
}) {
  const { camera, gl, scene, controls } = useThree() as any;
  const st = useRef({ pos: new THREE.Vector3(), look: new THREE.Vector3(), anim: false, tour: false, idx: 0, t: 0 });
  const sref = useRef(stations);
  sref.current = stations;
  const ext = Math.max(w, l);

  useEffect(() => {
    apiRef.current = {
      snapshot: () => {
        try {
          gl.render(scene, camera);
          return gl.domElement.toDataURL('image/png');
        } catch {
          return null;
        }
      },
      zoom: (factor: number) => {
        if (!controls) return;
        const d = camera.position.clone().sub(controls.target).multiplyScalar(factor);
        const len = THREE.MathUtils.clamp(d.length(), controls.minDistance, controls.maxDistance);
        camera.position.copy(controls.target).add(d.setLength(len));
        controls.update();
      },
    };
    return () => {
      apiRef.current = null;
    };
  }, [gl, scene, camera, controls, apiRef]);

  useEffect(() => {
    if (!controls) return;
    const stop = () => {
      if (st.current.anim) {
        st.current.anim = false;
        if (st.current.tour) onTourStep(null);
        st.current.tour = false;
        onFree();
      }
      controls.autoRotate = false;
    };
    controls.addEventListener('start', stop);
    return () => controls.removeEventListener('start', stop);
  }, [controls, onFree, onTourStep]);

  const overview = (s: typeof st.current) => {
    s.pos.set(ext * 0.7 + w * 0.1, ext * 0.62, ext * 0.74 + l * 0.12);
    s.look.set(0, 0.6, -l * 0.05);
  };

  useEffect(() => {
    if (view.mode === 'free') return;
    const s = st.current;
    s.anim = true;
    s.tour = false;
    if (controls) controls.autoRotate = false;
    if (view.mode === 'overview') overview(s);
    else if (view.mode === 'top') {
      s.pos.set(0.01, ext * 1.7, 0.01);
      s.look.set(0, 0, 0);
    } else if (view.mode === 'entrance') {
      s.pos.set(0, 1.75, l / 2 - 0.4);
      s.look.set(0, 1.6, -l / 2);
    } else if (view.mode === 'tour') {
      if (!sref.current.length) {
        s.anim = false;
        return;
      }
      s.tour = true;
      s.idx = 0;
      s.t = 0;
    }
  }, [view.n]); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((_, dt) => {
    const s = st.current;
    if (!s.anim || !controls) return;
    if (s.tour) {
      const list = sref.current;
      if (!list.length) {
        s.anim = false;
        s.tour = false;
        onTourStep(null);
        return;
      }
      const target = list[Math.min(s.idx, list.length - 1)];
      // stand towards the entrance side of the station, raised, looking at it
      const ang = target.rot + Math.PI * 0.12;
      const dist = KIND_RADIUS[target.kind] + 3.4;
      s.pos.set(target.x + Math.sin(ang) * dist, 3.0, target.z + Math.cos(ang) * dist);
      s.look.set(target.x, 1.2, target.z);
      if (s.t === 0) onTourStep(target.uid);
      s.t += dt;
      if (s.t > 4.2) {
        s.t = 0;
        s.idx += 1;
        if (s.idx >= list.length) {
          s.tour = false;
          onTourStep(null);
          overview(s);
        }
      }
    }
    const k = 1 - Math.exp(-dt * (s.tour ? 1.8 : 2.6));
    camera.position.lerp(s.pos, k);
    controls.target.lerp(s.look, k);
    controls.update();
    if (!s.tour && camera.position.distanceTo(s.pos) < 0.05 && controls.target.distanceTo(s.look) < 0.05) s.anim = false;
  });

  return null;
}

/* ─────────────── Scene ─────────────── */

export default function PlannerScene({
  stations,
  info,
  selected,
  guests,
  cfg,
  w,
  l,
  bounds: b,
  view,
  zoomOn,
  logoUrl,
  onDragStart,
  onSelect,
  onMove,
  onTourStep,
  onFree,
  apiRef,
}: {
  stations: Station[];
  info: Record<string, StationInfo>;
  selected: string | null;
  guests: number;
  cfg: VenueConfig;
  w: number;
  l: number;
  bounds: Bounds;
  view: ViewCmd;
  /** wheel-zoom only while the visitor is actively using the 3D view, so page scrolling is never trapped */
  zoomOn: boolean;
  /** company logo chosen by the visitor (stays in their browser) */
  logoUrl: string | null;
  onDragStart: () => void;
  onSelect: (uid: string | null) => void;
  onMove: (uid: string, x: number, z: number) => void;
  onTourStep: (uid: string | null) => void;
  onFree: () => void;
  apiRef: React.MutableRefObject<PlannerApi | null>;
}) {
  const ext = Math.max(w, l);
  const logoImg = useImage(logoUrl);
  const drag = useRef<string | null>(null);
  const controls = useRef<any>(null);
  const sref = useRef(stations);
  sref.current = stations;
  const bref = useRef(b);
  bref.current = b;
  const sel = stations.find((s) => s.uid === selected);
  const cols = THEMES[cfg.theme].colors;
  const stage = stageRect(cfg, w, l);

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

  const SKY: Record<TimeOfDay, { bg: string; amb: number; sun: string; sunPos: [number, number, number]; sunC: string }> = {
    day: { bg: '#8ec5ff', amb: 1.5, sun: '#fff3d1', sunPos: [60, 70, -80], sunC: '#fff6c8' },
    dusk: { bg: '#4b3270', amb: 1.0, sun: '#ffb27a', sunPos: [70, 22, -90], sunC: '#ffb27a' },
    night: { bg: '#070d1f', amb: 0.95, sun: '#9fb4ff', sunPos: [-60, 55, -90], sunC: '#dbe4ff' },
  };
  const sky = SKY[cfg.time];
  const night = cfg.venue === 'indoor' ? '#05071a' : sky.bg;
  const k = cfg.bright;

  // where the dance floor is (for the crowd)
  const dance = useMemo(() => {
    if (!cfg.dance) return null;
    const off = (stage ? stage.sd : 0) + 1.6 + 3.2;
    if (cfg.stage === 'left') return { x: -w / 2 + off, z: 0 };
    if (cfg.stage === 'right') return { x: w / 2 - off, z: 0 };
    return { x: 0, z: -l / 2 + off };
  }, [cfg.dance, cfg.stage, stage, w, l]);

  return (
    <Canvas
      dpr={[1, 1.6]}
      camera={{ position: [ext * 0.78, ext * 0.62, ext * 0.86], fov: 45, near: 0.1, far: 140 }}
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
      style={{ touchAction: 'none' }}
      onPointerMissed={() => onSelect(null)}
      aria-label="Interactive 3D venue. Drag stations to move them, drag empty space to rotate."
    >
      <color attach="background" args={[night]} />
      <fog attach="fog" args={[night, ext * 1.2, ext * 3.4]} />
      <ambientLight intensity={(cfg.venue === 'indoor' ? 1.15 : sky.amb) * k} />
      {cfg.venue === 'outdoor' && (
        <mesh position={sky.sunPos}>
          <sphereGeometry args={[cfg.time === 'night' ? 4 : 7, 24, 24]} />
          <meshBasicMaterial color={sky.sunC} />
        </mesh>
      )}
      <hemisphereLight args={['#c7d2fe', '#1e1b4b', 0.8 * k]} />
      <directionalLight position={[8, 16, 6]} intensity={1.5 * k} color={cfg.venue === 'outdoor' ? sky.sun : '#ffffff'} />
      <pointLight position={[-w / 3, 4.5, -l / 4]} intensity={45 * k} color={cols[0]} distance={ext * 1.6} />
      <pointLight position={[w / 3, 4.5, l / 3]} intensity={40 * k} color={cols[1]} distance={ext * 1.6} />
      <pointLight position={[0, 5, -l / 2 + 3]} intensity={30 * k} color={cols[2]} distance={ext} />

      {/* light pool on the selected station */}
      <pointLight position={[sel ? sel.x : 0, 4.2, sel ? sel.z + 0.8 : 0]} intensity={sel ? 55 : 0} distance={9} color="#ffffff" />

      <VenueShell cfg={cfg} w={w} l={l} guests={guests} logo={logoImg} />
      <Crowd guests={guests} b={b} stations={stations} dance={dance} />

      {stations.map((s) => (
        <StationNode
          key={s.uid}
          s={s}
          info={info[s.productId]}
          selected={selected === s.uid}
          onDown={(uid) => {
            drag.current = uid;
            onDragStart();
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
          const me = sref.current.find((q) => q.uid === drag.current);
          if (!me) return;
          const sx = Math.round(e.point.x * 4) / 4;
          const sz = Math.round(e.point.z * 4) / 4;
          const p = resolveCollisions(sx, sz, me.kind, sref.current.filter((q) => q.uid !== me.uid), bref.current);
          onMove(me.uid, p.x, p.z);
        }}
      >
        <planeGeometry args={[140, 140]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <OrbitControls
        ref={controls}
        makeDefault
        autoRotate
        autoRotateSpeed={0.5}
        enablePan={false}
        enableZoom={zoomOn}
        minDistance={4}
        maxDistance={ext * 2.1}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, 0.6, -l * 0.05]}
      />
      <Rig view={view} stations={stations} w={w} l={l} onTourStep={onTourStep} onFree={onFree} apiRef={apiRef} />
    </Canvas>
  );
}
