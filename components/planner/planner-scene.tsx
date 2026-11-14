'use client';

import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  KIND_COLOR,
  KIND_RADIUS,
  GUESTS_PER_DOT,
  bounds,
  floorSide,
  resolveCollisions,
  type Kind,
  type Station,
  type Venue,
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

type Person = { anchor: number; ang: number; rad: number; sp: number; p: number; fx: number; fz: number; cx: number; cz: number };

function Crowd({ guests, side, stations }: { guests: number; side: number; stations: Station[] }) {
  const count = Math.min(220, Math.max(6, Math.round(guests / GUESTS_PER_DOT)));
  const bodies = useRef<THREE.InstancedMesh>(null!);
  const heads = useRef<THREE.InstancedMesh>(null!);
  const sref = useRef(stations);
  sref.current = stations;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const b = bounds(side);

  const people = useMemo<Person[]>(() => {
    const rnd = mulberry32(guests * 7 + 13);
    return Array.from({ length: count }, () => {
      const fx = (rnd() * 2 - 1) * (side / 2 - 1.2);
      const fz = b.zMin - 1.2 + rnd() * (side / 2 - 1 - (b.zMin - 1.2));
      return { anchor: -1, ang: rnd() * 6.28, rad: 1.6 + rnd() * 1.8, sp: 0.15 + rnd() * 0.35, p: rnd() * 6.28, fx, fz, cx: fx, cz: fz };
    });
  }, [count, guests, side, b.zMin]);

  useLayoutEffect(() => {
    const palette = ['#c7d2fe', '#fda4af', '#fde68a', '#99f6e4', '#bae6fd', '#ddd6fe', '#fed7aa'].map((c) => new THREE.Color(c));
    const rnd = mulberry32(guests + 5);
    people.forEach((p, i) => {
      bodies.current.setColorAt(i, palette[Math.floor(rnd() * palette.length)]);
      heads.current.setColorAt(i, new THREE.Color('#f5d0b5').offsetHSL(0, 0, (rnd() - 0.5) * 0.18));
    });
    if (bodies.current.instanceColor) bodies.current.instanceColor.needsUpdate = true;
    if (heads.current.instanceColor) heads.current.instanceColor.needsUpdate = true;
  }, [people, guests]);

  useFrame((s, dt) => {
    const t = s.clock.elapsedTime;
    const st = sref.current;
    people.forEach((p, i) => {
      // about 60% of guests gather at stations (queue/play), the rest mingle
      p.anchor = st.length && i % 5 < 3 ? i % st.length : -1;
      let tx: number;
      let tz: number;
      if (p.anchor >= 0) {
        const a = st[p.anchor];
        const ang = p.ang + t * p.sp * 0.35;
        tx = a.x + Math.cos(ang) * (KIND_RADIUS[a.kind] + 0.5 + (p.rad - 1.6) * 0.6);
        tz = a.z + Math.sin(ang) * (KIND_RADIUS[a.kind] + 0.5 + (p.rad - 1.6) * 0.6);
      } else {
        tx = p.fx + Math.sin(t * p.sp + p.p) * 0.9;
        tz = p.fz + Math.cos(t * p.sp * 0.8 + p.p) * 0.9;
      }
      p.cx += (tx - p.cx) * Math.min(1, dt * 1.6);
      p.cz += (tz - p.cz) * Math.min(1, dt * 1.6);
      const hop = Math.abs(Math.sin(t * 2.2 + p.p)) * 0.07;
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

function useFloorTexture(venue: Venue, side: number) {
  return useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 512;
    const g = c.getContext('2d')!;
    if (venue === 'indoor') {
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
    } else {
      g.fillStyle = '#0f2a1e';
      g.fillRect(0, 0, 512, 512);
      const rnd = mulberry32(7);
      for (let i = 0; i < 5000; i++) {
        g.fillStyle = `rgba(${40 + rnd() * 40},${110 + rnd() * 70},${60 + rnd() * 40},${0.25 + rnd() * 0.35})`;
        g.fillRect(rnd() * 512, rnd() * 512, 2, 5);
      }
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(side / 8, side / 8);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }, [venue, side]);
}

function Stage({ side, venue }: { side: number; venue: Venue }) {
  const screen = useRef<THREE.MeshBasicMaterial>(null!);
  useFrame((s) => screen.current.color.setHSL((s.clock.elapsedTime * 0.05) % 1, 0.85, 0.5));
  const w = Math.min(side * 0.62, 14);
  const z = -side / 2 + 2.2;
  return (
    <group position={[0, 0, z]}>
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[w, 0.5, 4]} />
        <meshStandardMaterial color="#141a45" roughness={0.4} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.51, 1.99]}>
        <boxGeometry args={[w, 0.04, 0.04]} />
        <Glow color="#fb923c" i={2} />
      </mesh>
      <mesh position={[0, 2.5, -1.8]}>
        <planeGeometry args={[w * 0.92, 3.8]} />
        <meshBasicMaterial ref={screen} />
      </mesh>
      <mesh position={[0, 4.45, -1.7]}>
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
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 1.0, 0.4]}>
        <boxGeometry args={[2.2, 0.8, 0.9]} />
        <meshStandardMaterial color="#0b0f25" roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh position={[0, 1.42, 0.4]}>
        <boxGeometry args={[1.8, 0.04, 0.6]} />
        <Glow color="#a78bfa" i={1.6} />
      </mesh>
      <Html center position={[0, 5.2, -1.7]} distanceFactor={14} style={{ pointerEvents: 'none' }}>
        <div className="rounded-full border border-white/20 bg-black/50 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white/80">
          {venue === 'indoor' ? 'Main stage' : 'Open-air stage'}
        </div>
      </Html>
    </group>
  );
}

function Walls({ side }: { side: number }) {
  const h = 5;
  const panels = Math.max(3, Math.round(side / 5));
  const mat = <meshStandardMaterial color="#0d1235" roughness={0.8} metalness={0.2} />;
  return (
    <group>
      {/* inward-facing only (back-face culled) so the room is never hidden from outside */}
      <mesh position={[0, h / 2, -side / 2]}>
        <planeGeometry args={[side, h]} />
        {mat}
      </mesh>
      <mesh position={[-side / 2, h / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[side, h]} />
        {mat}
      </mesh>
      <mesh position={[side / 2, h / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[side, h]} />
        {mat}
      </mesh>
      {[-side / 2, side / 2].map((x) => (
        <group key={x}>
          <mesh position={[x + (x < 0 ? 0.04 : -0.04), 0.15, 0]}>
            <boxGeometry args={[0.05, 0.1, side]} />
            <Glow color="#fb923c" i={1.8} />
          </mesh>
          <mesh position={[x + (x < 0 ? 0.04 : -0.04), 4.6, 0]}>
            <boxGeometry args={[0.05, 0.08, side]} />
            <Glow color="#8b5cf6" i={1.8} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 4.6, -side / 2 + 0.04]}>
        <boxGeometry args={[side, 0.08, 0.05]} />
        <Glow color="#8b5cf6" i={1.8} />
      </mesh>
      {/* wall posters */}
      {Array.from({ length: panels }).map((_, i) => {
        const z = -side / 2 + ((i + 0.5) * side) / panels;
        const c = ['#f472b6', '#22d3ee', '#fb923c', '#a78bfa'][i % 4];
        return (
          <group key={i}>
            <mesh position={[-side / 2 + 0.05, 2.5, z]} rotation={[0, Math.PI / 2, 0]}>
              <planeGeometry args={[1.8, 2.4]} />
              <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.35} />
            </mesh>
            <mesh position={[side / 2 - 0.05, 2.5, z]} rotation={[0, -Math.PI / 2, 0]}>
              <planeGeometry args={[1.8, 2.4]} />
              <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.35} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function Pendants({ side }: { side: number }) {
  // ceiling-truss spot beams around the room; purely decorative
  const beams = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return { x: Math.cos(a) * side * 0.32, z: Math.sin(a) * side * 0.32, c: ['#8b5cf6', '#fb923c', '#22d3ee', '#f472b6'][i % 4] };
      }),
    [side]
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
            <meshBasicMaterial color={b.c} transparent opacity={0.07} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
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

function Seating({ guests, side }: { guests: number; side: number }) {
  const tables = Math.min(10, Math.max(2, Math.round(guests / 45)));
  const items = useMemo(
    () =>
      Array.from({ length: tables }, (_, i) => {
        const left = i % 2 === 0;
        const row = Math.floor(i / 2);
        const per = Math.ceil(tables / 2);
        const z = -side / 2 + 7.2 + (row * (side - 10)) / Math.max(1, per);
        return { x: (left ? -1 : 1) * (side / 2 - 1.3), z };
      }),
    [tables, side]
  );
  return (
    <group>
      {items.map((t, i) => (
        <group key={i} position={[t.x, 0, t.z]}>
          <mesh position={[0, 0.7, 0]}>
            <cylinderGeometry args={[0.55, 0.55, 0.06, 20]} />
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
          {[0, 1, 2, 3].map((k) => {
            const a = (k / 4) * Math.PI * 2 + 0.4;
            return (
              <mesh key={k} position={[Math.cos(a) * 0.95, 0.25, Math.sin(a) * 0.95]}>
                <cylinderGeometry args={[0.22, 0.22, 0.5, 14]} />
                <meshStandardMaterial color="#6366f1" roughness={0.6} />
              </mesh>
            );
          })}
        </group>
      ))}
    </group>
  );
}

function OutdoorPoles({ side }: { side: number }) {
  const pts = useMemo(() => {
    const n = Math.max(3, Math.round(side / 5));
    const out: [number, number][] = [];
    for (let i = 0; i <= n; i++) {
      const f = i / n - 0.5;
      out.push([f * side, -side / 2], [f * side, side / 2], [-side / 2, f * side], [side / 2, f * side]);
    }
    return out;
  }, [side]);
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
            <Glow color={i % 2 ? '#fde68a' : '#fdba74'} i={2.4} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function VenueShell({ side, venue, guests }: { side: number; venue: Venue; guests: number }) {
  const floor = useFloorTexture(venue, side);
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(side, 0.2, side)), [side]);
  return (
    <group>
      <mesh position={[0, -0.1, 0]}>
        <boxGeometry args={[side, 0.2, side]} />
        <meshStandardMaterial map={floor} roughness={venue === 'indoor' ? 0.3 : 0.95} metalness={venue === 'indoor' ? 0.55 : 0} />
      </mesh>
      <lineSegments position={[0, -0.1, 0]} geometry={edges}>
        <lineBasicMaterial color="#fb923c" />
      </lineSegments>
      {/* carpet runner from the entrance to the stage */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 1]}>
        <planeGeometry args={[2.2, side - 3]} />
        <meshStandardMaterial color="#7c3aed" emissive="#7c3aed" emissiveIntensity={0.2} roughness={0.9} transparent opacity={0.45} />
      </mesh>
      {venue === 'indoor' ? <Walls side={side} /> : <OutdoorPoles side={side} />}
      {venue === 'indoor' && <Pendants side={side} />}
      <Stage side={side} venue={venue} />
      <Seating guests={guests} side={side} />
      {/* entrance */}
      <group position={[0, 0, side / 2 - 0.15]}>
        {[-1.7, 1.7].map((x) => (
          <mesh key={x} position={[x, 1.3, 0]}>
            <boxGeometry args={[0.2, 2.6, 0.2]} />
            <Glow color="#8b5cf6" i={1.4} />
          </mesh>
        ))}
        <mesh position={[0, 2.6, 0]}>
          <boxGeometry args={[3.6, 0.2, 0.2]} />
          <Glow color="#8b5cf6" i={1.4} />
        </mesh>
        <Html center position={[0, 3.3, 0]} distanceFactor={12} style={{ pointerEvents: 'none' }}>
          <div className="rounded-full border border-violet-300/40 bg-violet-600/70 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white">
            Entrance
          </div>
        </Html>
      </group>
    </group>
  );
}

/* ─────────────── Camera rig: presets + guided tour ─────────────── */

function Rig({
  view,
  stations,
  side,
  onTourStep,
  onFree,
  apiRef,
}: {
  view: ViewCmd;
  stations: Station[];
  side: number;
  onTourStep: (uid: string | null) => void;
  onFree: () => void;
  apiRef: React.MutableRefObject<PlannerApi | null>;
}) {
  const { camera, gl, scene, controls } = useThree() as any;
  const st = useRef({ pos: new THREE.Vector3(), look: new THREE.Vector3(), anim: false, tour: false, idx: 0, t: 0 });
  const sref = useRef(stations);
  sref.current = stations;

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

  useEffect(() => {
    if (view.mode === 'free') return;
    const s = st.current;
    s.anim = true;
    s.tour = false;
    if (controls) controls.autoRotate = false;
    if (view.mode === 'overview') {
      s.pos.set(side * 0.78, side * 0.62, side * 0.86);
      s.look.set(0, 0.6, -side * 0.06);
    } else if (view.mode === 'top') {
      s.pos.set(0.01, side * 1.35, 0.01);
      s.look.set(0, 0, -side * 0.04);
    } else if (view.mode === 'entrance') {
      s.pos.set(0, 1.75, side / 2 - 0.4);
      s.look.set(0, 1.6, -side / 2);
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
      // stand in front of the station (towards the entrance), eye-level, looking at it
      const ang = target.rot + Math.PI * 0.12;
      s.pos.set(target.x + Math.sin(ang) * (KIND_RADIUS[target.kind] + 3.4), 3.0, target.z + Math.cos(ang) * (KIND_RADIUS[target.kind] + 3.4));
      s.look.set(target.x, 1.2, target.z);
      if (s.t === 0) onTourStep(target.uid);
      s.t += dt;
      if (s.t > 4.2) {
        s.t = 0;
        s.idx += 1;
        if (s.idx >= list.length) {
          s.tour = false;
          onTourStep(null);
          s.pos.set(side * 0.78, side * 0.62, side * 0.86);
          s.look.set(0, 0.6, -side * 0.06);
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
  venue,
  view,
  zoomOn,
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
  venue: Venue;
  view: ViewCmd;
  /** wheel-zoom only while the visitor is actively using the 3D view, so page scrolling is never trapped */
  zoomOn: boolean;
  onSelect: (uid: string | null) => void;
  onMove: (uid: string, x: number, z: number) => void;
  onTourStep: (uid: string | null) => void;
  onFree: () => void;
  apiRef: React.MutableRefObject<PlannerApi | null>;
}) {
  const side = floorSide(guests);
  const drag = useRef<string | null>(null);
  const controls = useRef<any>(null);
  const sref = useRef(stations);
  sref.current = stations;
  const sel = stations.find((s) => s.uid === selected);

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

  const night = venue === 'indoor' ? '#05071a' : '#070d1f';

  return (
    <Canvas
      dpr={[1, 1.6]}
      camera={{ position: [side * 0.78, side * 0.62, side * 0.86], fov: 45, near: 0.1, far: 120 }}
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
      style={{ touchAction: 'none' }}
      onPointerMissed={() => onSelect(null)}
      aria-label="Interactive 3D venue. Drag stations to move them, drag empty space to rotate, scroll to zoom."
    >
      <color attach="background" args={[night]} />
      <fog attach="fog" args={[night, side * 1.2, side * 3.2]} />
      <ambientLight intensity={venue === 'indoor' ? 1.15 : 1.0} />
      <hemisphereLight args={['#c7d2fe', '#1e1b4b', 0.8]} />
      <directionalLight position={[8, 16, 6]} intensity={1.5} />
      <pointLight position={[-side / 3, 4.5, -side / 4]} intensity={45} color="#8b5cf6" distance={side * 1.6} />
      <pointLight position={[side / 3, 4.5, side / 3]} intensity={40} color="#fb923c" distance={side * 1.6} />
      <pointLight position={[0, 5, -side / 2 + 3]} intensity={30} color="#22d3ee" distance={side} />

      {/* light pool on the selected station */}
      <pointLight position={[sel ? sel.x : 0, 4.2, sel ? sel.z + 0.8 : 0]} intensity={sel ? 55 : 0} distance={9} color="#ffffff" />

      <VenueShell side={side} venue={venue} guests={guests} />
      <Crowd guests={guests} side={side} stations={stations} />

      {stations.map((s) => (
        <StationNode
          key={s.uid}
          s={s}
          info={info[s.productId]}
          selected={selected === s.uid}
          onDown={(uid) => {
            drag.current = uid;
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
          const p = resolveCollisions(sx, sz, me.kind, sref.current.filter((q) => q.uid !== me.uid), side);
          onMove(me.uid, p.x, p.z);
        }}
      >
        <planeGeometry args={[120, 120]} />
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
        maxDistance={side * 2.1}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, 0.6, -side * 0.06]}
      />
      <Rig view={view} stations={stations} side={side} onTourStep={onTourStep} onFree={onFree} apiRef={apiRef} />
    </Canvas>
  );
}
