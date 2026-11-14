'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ZONES, cameraFor, type Route } from './world-math';

/**
 * The Retreat Arcade world: one long neon arcade hall made of primitives.
 * The camera is driven by page scroll + route (see world-math.ts).
 * Everything heavy is instanced; there are only 3 dynamic lights and no shadows.
 */

const C = {
  orange: '#fb923c',
  pink: '#f472b6',
  violet: '#8b5cf6',
  cyan: '#22d3ee',
  blue: '#3b82f6',
  yellow: '#facc15',
};
const NEON = [C.orange, C.pink, C.violet, C.cyan, C.blue, C.yellow];

const rnd = (seed: number) => {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/* ───────────── Hall shell: floor, neon rails, pillars, string lights ───────────── */

function Hall({ lite }: { lite: boolean }) {
  const bulbs = useRef<THREE.InstancedMesh>(null!);
  const bulbCount = lite ? 60 : 140;

  useEffect(() => {
    const d = new THREE.Object3D();
    const col = new THREE.Color();
    for (let i = 0; i < bulbCount; i++) {
      const t = i / bulbCount;
      const z = 10 - t * 170;
      const side = i % 2 ? 1 : -1;
      d.position.set(side * (3 + Math.sin(t * 40) * 1.5), 7.2 - Math.abs(Math.sin(t * 60)) * 0.8, z);
      d.scale.setScalar(0.12);
      d.updateMatrix();
      bulbs.current.setMatrixAt(i, d.matrix);
      col.set(NEON[i % NEON.length]);
      bulbs.current.setColorAt(i, col);
    }
    bulbs.current.instanceMatrix.needsUpdate = true;
    if (bulbs.current.instanceColor) bulbs.current.instanceColor.needsUpdate = true;
  }, [bulbCount]);

  return (
    <group>
      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -70]}>
        <planeGeometry args={[60, 200]} />
        <meshStandardMaterial color="#0a0d2b" roughness={0.35} metalness={0.5} />
      </mesh>
      <gridHelper args={[200, 100, '#fb923c', '#2b2f66']} position={[0, 0.02, -70]} />
      {/* lane lights */}
      {[-6, 0, 6].map((x) => (
        <mesh key={x} position={[x, 0.03, -70]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.12, 200]} />
          <meshBasicMaterial color={x === 0 ? C.violet : C.cyan} transparent opacity={0.55} />
        </mesh>
      ))}
      {/* side neon rails (floor + ceiling) */}
      {[-13, 13].map((x, i) =>
        [0.3, 8.4].map((y) => (
          <mesh key={`${x}-${y}`} position={[x, y, -70]}>
            <boxGeometry args={[0.18, 0.18, 200]} />
            <meshBasicMaterial color={i === 0 ? C.pink : C.cyan} />
          </mesh>
        ))
      )}
      {/* walls (dark, so neon reads) */}
      {[-14, 14].map((x) => (
        <mesh key={x} position={[x, 4.5, -70]}>
          <boxGeometry args={[0.3, 9, 200]} />
          <meshStandardMaterial color="#0b0f33" roughness={0.8} />
        </mesh>
      ))}
      {/* ceiling */}
      <mesh position={[0, 9, -70]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[60, 200]} />
        <meshStandardMaterial color="#080a24" roughness={0.9} />
      </mesh>
      {/* pillars with neon rings */}
      {Array.from({ length: lite ? 8 : 14 }, (_, i) => {
        const z = 6 - i * 12;
        return [-11, 11].map((x) => (
          <group key={`${i}-${x}`} position={[x, 0, z]}>
            <mesh position={[0, 4.5, 0]}>
              <cylinderGeometry args={[0.45, 0.45, 9, 12]} />
              <meshStandardMaterial color="#141a4d" roughness={0.5} metalness={0.4} />
            </mesh>
            <mesh position={[0, 2.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.62, 0.04, 8, 28]} />
              <meshBasicMaterial color={NEON[i % NEON.length]} />
            </mesh>
            <mesh position={[0, 6.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.62, 0.04, 8, 28]} />
              <meshBasicMaterial color={NEON[(i + 2) % NEON.length]} />
            </mesh>
          </group>
        ));
      })}
      {/* string lights */}
      <instancedMesh ref={bulbs} args={[undefined, undefined, bulbCount]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

/* ───────────── Zone 0 · Lobby ───────────── */

function Lobby() {
  const ball = useRef<THREE.Mesh>(null!);
  const coins = useRef<THREE.InstancedMesh>(null!);
  const data = useMemo(() => {
    const r = rnd(5);
    return Array.from({ length: 40 }, () => ({ x: (r() < 0.5 ? -1 : 1) * (3 + r() * 8), z: -r() * 22 + 4, s: 0.4 + r() * 0.8, p: r() * 10 }));
  }, []);
  const d = useMemo(() => new THREE.Object3D(), []);

  useFrame((s) => {
    const t = s.clock.elapsedTime;
    ball.current.rotation.y = t * 0.4;
    data.forEach((c, i) => {
      d.position.set(c.x, 1.2 + ((t * c.s * 0.5 + c.p) % 5), c.z);
      d.rotation.set(Math.PI / 2, 0, t * 1.5 + c.p);
      d.scale.setScalar(0.16);
      d.updateMatrix();
      coins.current.setMatrixAt(i, d.matrix);
    });
    coins.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group position={[0, 0, ZONES[0].z]}>
      {/* entrance arch */}
      <mesh position={[0, 4.2, -8]}>
        <torusGeometry args={[5.2, 0.14, 12, 64]} />
        <meshBasicMaterial color={C.orange} toneMapped={false} />
      </mesh>
      <mesh position={[0, 4.2, -8.4]}>
        <torusGeometry args={[4.4, 0.08, 12, 64]} />
        <meshBasicMaterial color={C.pink} toneMapped={false} />
      </mesh>
      <mesh position={[0, 4.2, -8.8]}>
        <torusGeometry args={[3.7, 0.06, 12, 64]} />
        <meshBasicMaterial color={C.cyan} toneMapped={false} />
      </mesh>
      {/* disco ball */}
      <mesh position={[0, 6.3, -13]}>
        <cylinderGeometry args={[0.02, 0.02, 3, 6]} />
        <meshBasicMaterial color="#cbd5e1" />
      </mesh>
      <mesh ref={ball} position={[0, 5.2, -13]}>
        <icosahedronGeometry args={[1.5, 1]} />
        <meshStandardMaterial color="#f1f5f9" emissive="#6366f1" emissiveIntensity={0.45} roughness={0.2} metalness={0.4} flatShading />
      </mesh>
      {/* rising coins */}
      <instancedMesh ref={coins} args={[undefined, undefined, data.length]}>
        <cylinderGeometry args={[1, 1, 0.14, 20]} />
        <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.7} metalness={0.5} roughness={0.3} />
      </instancedMesh>
    </group>
  );
}

/* ───────────── Zone 1 · Games floor ───────────── */

function GamesFloor({ lite }: { lite: boolean }) {
  const perSide = lite ? 5 : 8;
  const count = perSide * 2;
  const body = useRef<THREE.InstancedMesh>(null!);
  const screen = useRef<THREE.InstancedMesh>(null!);
  const marquee = useRef<THREE.InstancedMesh>(null!);
  const claw = useRef<THREE.Group>(null!);

  useEffect(() => {
    const d = new THREE.Object3D();
    const col = new THREE.Color();
    const r = rnd(11);
    for (let i = 0; i < count; i++) {
      const side = i < perSide ? -1 : 1;
      const k = i % perSide;
      const x = side * 7.2;
      const z = 6 - k * 3.1;
      d.position.set(x, 1.25, z);
      d.rotation.set(0, side > 0 ? -Math.PI / 2 + 0.25 : Math.PI / 2 - 0.25, 0);
      d.scale.set(1, 1, 1);
      d.updateMatrix();
      body.current.setMatrixAt(i, d.matrix);

      // screen sits proud of the body, in the cabinet's local frame
      const s = new THREE.Object3D();
      s.position.set(x, 1.65, z);
      s.rotation.copy(d.rotation);
      s.translateZ(0.58);
      s.rotateX(-0.25);
      s.updateMatrix();
      screen.current.setMatrixAt(i, s.matrix);
      col.set(NEON[Math.floor(r() * NEON.length)]);
      screen.current.setColorAt(i, col);

      const m = new THREE.Object3D();
      m.position.set(x, 2.62, z);
      m.rotation.copy(d.rotation);
      m.translateZ(0.35);
      m.updateMatrix();
      marquee.current.setMatrixAt(i, m.matrix);
      marquee.current.setColorAt(i, col);
    }
    [body, screen, marquee].forEach((m) => {
      m.current.instanceMatrix.needsUpdate = true;
      if (m.current.instanceColor) m.current.instanceColor.needsUpdate = true;
    });
  }, [count, perSide]);

  useFrame((s) => {
    const t = s.clock.elapsedTime;
    claw.current.position.x = Math.sin(t * 0.7) * 1.1;
    claw.current.position.z = Math.cos(t * 0.5) * 0.7;
    claw.current.position.y = 3.2 + Math.sin(t * 1.4) * 0.5;
  });

  return (
    <group position={[0, 0, ZONES[1].z]}>
      <instancedMesh ref={body} args={[undefined, undefined, count]}>
        <boxGeometry args={[1.3, 2.5, 1.1]} />
        <meshStandardMaterial color="#1b2160" roughness={0.45} metalness={0.3} />
      </instancedMesh>
      <instancedMesh ref={screen} args={[undefined, undefined, count]}>
        <planeGeometry args={[1, 0.8]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={marquee} args={[undefined, undefined, count]}>
        <boxGeometry args={[1.25, 0.28, 0.2]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>

      {/* claw machine, centre */}
      <group position={[0, 0, -4]}>
        <mesh position={[0, 1.6, 0]}>
          <boxGeometry args={[3, 3.2, 3]} />
          <meshStandardMaterial color="#8b5cf6" transparent opacity={0.28} roughness={0.1} metalness={0.2} />
        </mesh>
        <lineSegments position={[0, 1.6, 0]}>
          <edgesGeometry args={[new THREE.BoxGeometry(3, 3.2, 3)]} />
          <lineBasicMaterial color={C.pink} />
        </lineSegments>
        <mesh position={[0, 0.3, 0]}>
          <boxGeometry args={[3, 0.6, 3]} />
          <meshStandardMaterial color="#312e81" />
        </mesh>
        <group ref={claw}>
          <mesh position={[0, 1, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 2, 6]} />
            <meshBasicMaterial color="#e2e8f0" />
          </mesh>
          <mesh>
            <coneGeometry args={[0.3, 0.5, 4]} />
            <meshStandardMaterial color={C.yellow} emissive={C.yellow} emissiveIntensity={0.6} />
          </mesh>
        </group>
        {/* prizes */}
        {[-0.9, -0.3, 0.4, 1].map((x, i) => (
          <mesh key={i} position={[x, 0.85, (i % 2) * 0.8 - 0.4]}>
            <sphereGeometry args={[0.28, 12, 12]} />
            <meshStandardMaterial color={NEON[i]} emissive={NEON[i]} emissiveIntensity={0.5} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/* ───────────── Zone 2 · VR zone ───────────── */

function VRZone() {
  const gems = useRef<(THREE.Group | null)[]>([]);
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    gems.current.forEach((g, i) => {
      if (!g) return;
      g.position.y = 2.7 + Math.sin(t * 1.1 + i) * 0.25;
      g.rotation.y = t * 0.6 + i;
    });
  });
  const pods = [
    [-6, 0, 2],
    [6, 0, 2],
    [-6, 0, -6],
    [6, 0, -6],
    [0, 0, -10],
  ];
  return (
    <group position={[0, 0, ZONES[2].z]}>
      {pods.map(([x, , z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[2, 2.2, 0.4, 36]} />
            <meshStandardMaterial color="#1b2160" roughness={0.4} metalness={0.4} />
          </mesh>
          <mesh position={[0, 0.45, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.5, 1.7, 48]} />
            <meshBasicMaterial color={NEON[(i + 3) % NEON.length]} toneMapped={false} />
          </mesh>
          {/* light beam */}
          <mesh position={[0, 4.4, 0]}>
            <cylinderGeometry args={[0.2, 1.9, 8, 24, 1, true]} />
            <meshBasicMaterial color={NEON[(i + 2) % NEON.length]} transparent opacity={0.09} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
          <group
            ref={(el) => {
              gems.current[i] = el;
            }}
            position={[0, 2.7, 0]}
          >
            <mesh>
              <octahedronGeometry args={[0.75, 0]} />
              <meshStandardMaterial color={C.violet} emissive={C.violet} emissiveIntensity={0.7} flatShading />
            </mesh>
            <mesh scale={1.35}>
              <octahedronGeometry args={[0.75, 0]} />
              <meshBasicMaterial color={C.cyan} wireframe transparent opacity={0.5} />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
}

/* ───────────── Zone 3 · Photo studio ───────────── */

function PhotoStudio() {
  const arm = useRef<THREE.Group>(null!);
  const flash = useRef<THREE.MeshBasicMaterial>(null!);
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    arm.current.rotation.y = t * 0.8;
    const f = Math.max(0, Math.sin(t * 2.2));
    flash.current.opacity = 0.35 + f ** 8 * 0.65;
  });
  return (
    <group position={[0, 0, ZONES[3].z - 2]}>
      {/* turntable platform */}
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[3.4, 3.6, 0.6, 48]} />
        <meshStandardMaterial color="#1b2160" roughness={0.3} metalness={0.6} />
      </mesh>
      <mesh position={[0, 0.62, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.6, 2.8, 64]} />
        <meshBasicMaterial color={C.pink} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.62, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.4, 1.5, 64]} />
        <meshBasicMaterial color={C.orange} toneMapped={false} />
      </mesh>
      {/* 360° camera arm */}
      <group ref={arm}>
        <mesh position={[0, 3.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.9, 0.07, 10, 80]} />
          <meshBasicMaterial color={C.cyan} toneMapped={false} />
        </mesh>
        <mesh position={[2.9, 3.5, 0]}>
          <boxGeometry args={[0.7, 0.5, 0.5]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.3} metalness={0.5} />
        </mesh>
        <mesh position={[2.9, 3.5, 0.28]}>
          <circleGeometry args={[0.16, 16]} />
          <meshBasicMaterial color={C.cyan} />
        </mesh>
      </group>
      {/* softboxes */}
      {[-1, 1].map((side) =>
        [0, 1].map((k) => (
          <mesh key={`${side}-${k}`} position={[side * 6.5, 2.6, -2 + k * 5]} rotation={[0, -side * 0.9, 0]}>
            <boxGeometry args={[2.4, 3.2, 0.2]} />
            <meshBasicMaterial ref={k === 0 && side === 1 ? flash : undefined} color="#fff7ed" transparent opacity={0.6} toneMapped={false} />
          </mesh>
        ))
      )}
      {/* backdrop sweep */}
      <mesh position={[0, 4, -7]}>
        <planeGeometry args={[18, 8]} />
        <meshBasicMaterial color="#2a1a5e" />
      </mesh>
      <mesh position={[0, 4, -6.9]}>
        <ringGeometry args={[3.4, 3.55, 64]} />
        <meshBasicMaterial color={C.violet} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ───────────── Zone 4 · Party stage ───────────── */

function PartyStage({ lite }: { lite: boolean }) {
  const beams = useRef<(THREE.Mesh | null)[]>([]);
  const crowd = useRef<THREE.InstancedMesh>(null!);
  const n = lite ? 50 : 110;
  const pts = useMemo(() => {
    const r = rnd(21);
    return Array.from({ length: n }, () => ({ x: (r() - 0.5) * 20, z: 2 + r() * 10, p: r() * 6.28 }));
  }, [n]);
  const d = useMemo(() => new THREE.Object3D(), []);

  useFrame((s) => {
    const t = s.clock.elapsedTime;
    beams.current.forEach((b, i) => {
      if (!b) return;
      b.rotation.z = Math.sin(t * 0.9 + i * 1.3) * 0.5;
      b.rotation.x = Math.cos(t * 0.7 + i) * 0.25;
    });
    pts.forEach((c, i) => {
      d.position.set(c.x, 0.4 + Math.abs(Math.sin(t * 2.2 + c.p)) * 0.35, c.z);
      d.scale.set(1, 1, 1);
      d.updateMatrix();
      crowd.current.setMatrixAt(i, d.matrix);
    });
    crowd.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group position={[0, 0, ZONES[4].z - 6]}>
      <mesh position={[0, 0.6, -6]}>
        <boxGeometry args={[16, 1.2, 7]} />
        <meshStandardMaterial color="#1b2160" roughness={0.4} metalness={0.4} />
      </mesh>
      <mesh position={[0, 1.22, -2.45]}>
        <boxGeometry args={[16, 0.06, 0.06]} />
        <meshBasicMaterial color={C.pink} toneMapped={false} />
      </mesh>
      {/* truss arch */}
      <mesh position={[0, 7, -8]}>
        <boxGeometry args={[18, 0.35, 0.35]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.6} roughness={0.35} />
      </mesh>
      {[-9, 9].map((x) => (
        <mesh key={x} position={[x, 3.6, -8]}>
          <boxGeometry args={[0.35, 7.2, 0.35]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.6} roughness={0.35} />
        </mesh>
      ))}
      {/* big LED screen */}
      <mesh position={[0, 4, -9.4]}>
        <planeGeometry args={[11, 5]} />
        <meshBasicMaterial color="#1d1b5e" />
      </mesh>
      <mesh position={[0, 4, -9.3]}>
        <ringGeometry args={[1.8, 2, 48]} />
        <meshBasicMaterial color={C.orange} toneMapped={false} />
      </mesh>
      {/* sweeping beams */}
      {Array.from({ length: 6 }, (_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            beams.current[i] = el;
          }}
          position={[-7.5 + i * 3, 6.8, -7.5]}
        >
          <coneGeometry args={[1.2, 11, 16, 1, true]} />
          <meshBasicMaterial color={NEON[i % NEON.length]} transparent opacity={0.1} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      ))}
      {/* crowd */}
      <instancedMesh ref={crowd} args={[undefined, undefined, pts.length]}>
        <capsuleGeometry args={[0.14, 0.4, 4, 8]} />
        <meshStandardMaterial color="#c7d2fe" emissive="#6366f1" emissiveIntensity={0.35} />
      </instancedMesh>
    </group>
  );
}

/* ───────────── Camera rig, dust, lights ───────────── */

function Dust({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null!);
  const pos = useMemo(() => {
    const r = rnd(77);
    const a = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      a[i * 3] = (r() - 0.5) * 26;
      a[i * 3 + 1] = r() * 8;
      a[i * 3 + 2] = 10 - r() * 160;
    }
    return a;
  }, [count]);
  useFrame((s) => {
    ref.current.position.y = Math.sin(s.clock.elapsedTime * 0.2) * 0.3;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={pos} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.06} color="#fde68a" transparent opacity={0.6} sizeAttenuation depthWrite={false} />
    </points>
  );
}

function Rig({
  route,
  progress,
  onZone,
}: {
  route: Route;
  progress: React.MutableRefObject<number>;
  onZone?: (z: number) => void;
}) {
  const lights = useRef<THREE.Group>(null!);
  const pointer = useRef({ x: 0, y: 0 });
  const cur = useRef({ pos: new THREE.Vector3(0, 2, 8), look: new THREE.Vector3(0, 1.5, -6) });
  const first = useRef(true);
  const tmpP = useMemo(() => new THREE.Vector3(), []);
  const tmpL = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, []);

  useFrame((s) => {
    const tgt = cameraFor(route, progress.current, s.clock.elapsedTime);
    tmpP.set(tgt.pos[0] + pointer.current.x * 0.9, tgt.pos[1] - pointer.current.y * 0.35, tgt.pos[2]);
    tmpL.set(tgt.look[0] + pointer.current.x * 1.5, tgt.look[1] - pointer.current.y * 0.6, tgt.look[2]);
    const k = first.current ? 1 : 0.05; // damped follow = smooth fly between pages too
    first.current = false;
    cur.current.pos.lerp(tmpP, k);
    cur.current.look.lerp(tmpL, k);
    // on wide screens, push the scene to the right so left-aligned copy never sits on the focal point
    const w = s.size.width, h = s.size.height;
    const cam = s.camera as THREE.PerspectiveCamera;
    if (w > 1100) cam.setViewOffset(w, h, -w * 0.17, 0, w, h);
    else cam.clearViewOffset();
    s.camera.position.copy(cur.current.pos);
    s.camera.lookAt(cur.current.look);
    lights.current.position.copy(cur.current.pos);
    onZone?.(tgt.z);
  });

  return (
    <group ref={lights}>
      <pointLight position={[-5, 3, -6]} intensity={45} distance={34} color={C.violet} />
      <pointLight position={[5, 3, -10]} intensity={40} distance={34} color={C.orange} />
      <pointLight position={[0, 5, -18]} intensity={34} distance={40} color={C.cyan} />
    </group>
  );
}

export default function WorldScene({
  route,
  progress,
  active = true,
  lite = false,
}: {
  route: Route;
  progress: React.MutableRefObject<number>;
  active?: boolean;
  lite?: boolean;
}) {
  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      dpr={[1, lite ? 1 : 1.4]}
      camera={{ position: [0, 2, 8], fov: 62, near: 0.1, far: 90 }}
      gl={{ antialias: !lite, alpha: false, powerPreference: 'high-performance' }}
      style={{ pointerEvents: 'none' }}
      aria-hidden
    >
      <color attach="background" args={['#06081f']} />
      <fog attach="fog" args={['#06081f', 12, lite ? 55 : 72]} />
      <ambientLight intensity={0.85} />
      <hemisphereLight args={['#a5b4fc', '#1e1b4b', 0.7]} />
      <Hall lite={lite} />
      <Lobby />
      <GamesFloor lite={lite} />
      <VRZone />
      <PhotoStudio />
      <PartyStage lite={lite} />
      <Dust count={lite ? 160 : 360} />
      <Rig route={route} progress={progress} />
    </Canvas>
  );
}
