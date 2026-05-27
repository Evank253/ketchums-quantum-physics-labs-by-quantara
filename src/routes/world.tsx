import { createFileRoute, Link } from "@tanstack/react-router";
import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PointerLockControls, Sky, Text } from "@react-three/drei";
import * as THREE from "three";
import { useWorld, nextCost, getBreakthrough, getOfflineCapHours, setOfflineCapHours } from "@/lib/world-store";
import { readDat, subscribeDat } from "@/lib/dat-tokens";

export const Route = createFileRoute("/world")({
  component: WorldPage,
  head: () => ({
    meta: [
      { title: "Quantara World — Walk through the synthetic civilization" },
      {
        name: "description",
        content:
          "First-person walk through a living world where Quantara's bots discover and build. Live, persistent, and clearly labeled as simulation.",
      },
      { property: "og:title", content: "Quantara World" },
      {
        property: "og:description",
        content: "A walkable simulation of Quantara's bot civilization with a live breakthrough ledger.",
      },
    ],
  }),
});

function Ground({ size }: { size: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[size, size, 1, 1]} />
      <meshStandardMaterial color="#0b0d1a" roughness={0.95} />
    </mesh>
  );
}

function GridLines({ size }: { size: number }) {
  return (
    <gridHelper args={[size, Math.min(80, Math.round(size / 2)), "#2a2752", "#15142a"]} position={[0, 0.01, 0]} />
  );
}

type BotProps = { x: number; z: number; hue: number; label: string; sublabel: string };
function Bot({ x, z, hue, label, sublabel }: BotProps) {
  const ref = useRef<THREE.Group>(null);
  const color = `hsl(${hue}, 80%, 60%)`;
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y += 0.01;
    ref.current.position.y = 1.2 + Math.sin(state.clock.elapsedTime * 2 + x) * 0.08;
  });
  return (
    <group ref={ref} position={[x, 1.2, z]}>
      <mesh castShadow>
        <icosahedronGeometry args={[0.55, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} metalness={0.4} roughness={0.3} />
      </mesh>
      <pointLight color={color} intensity={0.7} distance={6} />
      <Text position={[0, 1.0, 0]} fontSize={0.32} color="#fff" anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="#000">
        {label}
      </Text>
      <Text position={[0, 0.68, 0]} fontSize={0.18} color="#bcbcd6" anchorX="center" anchorY="middle">
        {sublabel}
      </Text>
    </group>
  );
}

function Building({ x, z, h, hue, name }: { x: number; z: number; h: number; hue: number; name: string }) {
  const color = `hsl(${hue}, 50%, 40%)`;
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, h / 2, 0]} castShadow>
        <boxGeometry args={[2.2, h, 2.2]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.15} metalness={0.3} roughness={0.6} />
      </mesh>
      <Text position={[0, h + 0.6, 0]} fontSize={0.28} color="#e7e7ff" anchorX="center" outlineWidth={0.02} outlineColor="#000">
        {name}
      </Text>
    </group>
  );
}

function Player() {
  const { camera } = useThree();
  const keys = useRef<Record<string, boolean>>({});
  const velocity = useRef(new THREE.Vector3());
  useEffect(() => {
    const d = (e: KeyboardEvent) => (keys.current[e.code] = true);
    const u = (e: KeyboardEvent) => (keys.current[e.code] = false);
    window.addEventListener("keydown", d);
    window.addEventListener("keyup", u);
    camera.position.set(0, 2, 18);
    return () => {
      window.removeEventListener("keydown", d);
      window.removeEventListener("keyup", u);
    };
  }, [camera]);
  useFrame((_, delta) => {
    const speed = (keys.current["ShiftLeft"] ? 12 : 6) * delta;
    const fwd = new THREE.Vector3();
    camera.getWorldDirection(fwd);
    fwd.y = 0;
    fwd.normalize();
    const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
    velocity.current.set(0, 0, 0);
    if (keys.current["KeyW"]) velocity.current.add(fwd);
    if (keys.current["KeyS"]) velocity.current.sub(fwd);
    if (keys.current["KeyD"]) velocity.current.add(right);
    if (keys.current["KeyA"]) velocity.current.sub(right);
    velocity.current.normalize().multiplyScalar(speed);
    camera.position.add(velocity.current);
    camera.position.y = 2;
  });
  return null;
}

function Scene() {
  const bots = useWorld((s) => s.bots);
  const worldSize = useWorld((s) => s.worldSize);
  const unlocked = useWorld((s) => s.unlocked);
  // Place a building per unlock around a spiral.
  const buildings = unlocked.map((u, i) => {
    const angle = i * 0.7;
    const radius = 6 + i * 1.6;
    const bt = getBreakthrough(u.id);
    return {
      x: Math.cos(angle) * radius,
      z: Math.sin(angle) * radius,
      h: 2 + ((i % 5) + 1) * 0.9,
      hue: ((bt?.tier ?? 1) * 47) % 360,
      name: bt?.name.split(" ").slice(0, 2).join(" ") ?? u.id,
    };
  });
  return (
    <>
      <Sky distance={450000} sunPosition={[10, 4, 10]} turbidity={6} rayleigh={2} mieCoefficient={0.005} mieDirectionalG={0.8} />
      <ambientLight intensity={0.3} />
      <directionalLight position={[20, 30, 10]} intensity={1.0} castShadow />
      <Ground size={Math.max(60, worldSize * 1.4)} />
      <GridLines size={Math.max(60, worldSize * 1.4)} />
      {bots.map((b) => (
        <Bot key={b.id} x={b.x} z={b.z} hue={b.hue} label={b.name} sublabel={b.role} />
      ))}
      {buildings.map((b, i) => (
        <Building key={i} {...b} />
      ))}
      <Player />
      <PointerLockControls />
    </>
  );
}

function WorldPage() {
  const init = useWorld((s) => s.init);
  const startLoop = useWorld((s) => s.startLoop);
  const reset = useWorld((s) => s.reset);
  const research = useWorld((s) => s.researchPoints);
  const total = useWorld((s) => s.totalResearch);
  const unlocked = useWorld((s) => s.unlocked);
  const worldSize = useWorld((s) => s.worldSize);
  const [hint, setHint] = useState(true);

  useEffect(() => {
    init();
    const stop = startLoop();
    return stop;
  }, [init, startLoop]);

  const cost = nextCost(unlocked.length);
  const pct = Math.min(100, (research / cost) * 100);
  const latest = unlocked[unlocked.length - 1];
  const latestBt = latest ? getBreakthrough(latest.id) : null;

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black text-white">
      <Canvas shadows camera={{ fov: 70, near: 0.1, far: 2000 }} onClick={() => setHint(false)}>
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>

      {/* HUD */}
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4 font-mono text-xs">
        <div className="flex items-start justify-between gap-3">
          <div className="pointer-events-auto rounded-sm border border-white/15 bg-black/55 px-3 py-2 backdrop-blur-sm">
            <div className="text-[10px] uppercase tracking-[0.25em] text-chrome">Quantara World · live sim</div>
            <div className="mt-1 text-[10px] text-amber-300/80">Simulation — bots, "discoveries" and growth are procedural, not real research.</div>
          </div>
          <div className="pointer-events-auto flex flex-col gap-2">
            <Link
              to="/world/ledger"
              className="rounded-sm border border-accent/40 bg-black/55 px-3 py-2 text-[10px] uppercase tracking-[0.25em] text-white hover:bg-accent/15"
            >
              Open Ledger ({unlocked.length})
            </Link>
            <Link
              to="/"
              className="rounded-sm border border-white/15 bg-black/55 px-3 py-2 text-[10px] uppercase tracking-[0.25em] text-white hover:bg-white/10"
            >
              ← Back to main site
            </Link>
            <button
              onClick={() => {
                if (confirm("Reset Quantara World? All unlocks will be lost.")) reset();
              }}
              className="rounded-sm border border-red-500/30 bg-black/55 px-3 py-2 text-[10px] uppercase tracking-[0.25em] text-red-300 hover:bg-red-500/10"
            >
              Reset world
            </button>
          </div>
        </div>

        {hint && (
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-sm border border-white/20 bg-black/70 px-4 py-3 text-center backdrop-blur-sm">
            <div className="text-[10px] uppercase tracking-[0.3em] text-chrome">Click to enter</div>
            <div className="mt-2 text-[11px] text-white">WASD to walk · mouse to look · Shift to run · Esc to release</div>
          </div>
        )}

        <div className="pointer-events-auto grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-sm border border-white/10 bg-black/55 p-3 backdrop-blur-sm">
            <div className="text-[10px] uppercase tracking-[0.25em] text-chrome">Next discovery</div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-sm bg-white/10">
              <div className="h-full bg-accent transition-all" style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-1 text-[10px] text-muted-foreground">
              {research.toFixed(1)} / {cost.toFixed(0)} research · world size {worldSize.toFixed(0)}
            </div>
          </div>
          <div className="rounded-sm border border-white/10 bg-black/55 p-3 backdrop-blur-sm">
            <div className="text-[10px] uppercase tracking-[0.25em] text-chrome">Total research</div>
            <div className="mt-1 text-lg font-bold text-white">{total.toFixed(0)} pts</div>
            <div className="text-[10px] text-muted-foreground">Bots keep working while you're offline (capped 7 days).</div>
          </div>
          <div className="rounded-sm border border-white/10 bg-black/55 p-3 backdrop-blur-sm">
            <div className="text-[10px] uppercase tracking-[0.25em] text-chrome">Latest unlock</div>
            <div className="mt-1 text-sm font-bold text-white">{latestBt ? latestBt.name : "—"}</div>
            <div className="text-[10px] text-muted-foreground">
              {latest ? `by ${latest.discoveredBy} · ${new Date(latest.unlockedAt).toLocaleString()}` : "no discoveries yet"}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
