import { createFileRoute, Link } from "@tanstack/react-router";
import { Suspense, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PointerLockControls, Sky, Text, Sparkles, ContactShadows, Environment } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, ChromaticAberration, SMAA, BrightnessContrast } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import { useWorld, nextCost, getBreakthrough, getOfflineCapHours, setOfflineCapHours } from "@/lib/world-store";
import { useGameplay, type InventoryEntry } from "@/lib/world-gameplay";
import { readDat, subscribeDat, creditDat, writeDat } from "@/lib/dat-tokens";
import { TouchJoystick, TouchButton, useIsTouch } from "@/components/touch-joystick";
import { ingestFile, readDiscoveries, removeDiscovery, subscribeDiscoveries, type Discovery } from "@/lib/discoveries";

export const Route = createFileRoute("/world")({
  component: WorldPage,
  head: () => ({
    meta: [
      { title: "Quantara World — Walk through the synthetic civilization" },
      {
        name: "description",
        content:
          "Walk first-person through a living world. Clean bad-data with phase weapons, loot artifacts and contracts, trade at the $DAT marketplace.",
      },
      { property: "og:title", content: "Quantara World" },
      {
        property: "og:description",
        content: "A walkable simulation with weapons, marketplace, artifacts, contracts and boosts.",
      },
    ],
  }),
});

// --------- Visual fundament: hex-tile ground with emissive grid ----------
function Ground({ size }: { size: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[size, size, 1, 1]} />
      <meshStandardMaterial color="#06070f" roughness={0.85} metalness={0.4} />
    </mesh>
  );
}

function GridLines({ size }: { size: number }) {
  return (
    <gridHelper args={[size, Math.min(120, Math.round(size / 1.5)), "#3b2f8e", "#0e0a26"]} position={[0, 0.01, 0]} />
  );
}

// --------- Bot citizens ----------
function Bot({ x, z, hue, label, sublabel }: { x: number; z: number; hue: number; label: string; sublabel: string }) {
  const ref = useRef<THREE.Group>(null);
  const color = `hsl(${hue}, 85%, 62%)`;
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y += 0.01;
    ref.current.position.y = 1.2 + Math.sin(state.clock.elapsedTime * 2 + x) * 0.08;
  });
  return (
    <group ref={ref} position={[x, 1.2, z]}>
      <mesh castShadow>
        <icosahedronGeometry args={[0.55, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.9} metalness={0.5} roughness={0.2} />
      </mesh>
      <pointLight color={color} intensity={0.9} distance={7} />
      <Text position={[0, 1.0, 0]} fontSize={0.32} color="#fff" anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="#000">{label}</Text>
      <Text position={[0, 0.68, 0]} fontSize={0.18} color="#bcbcd6" anchorX="center" anchorY="middle">{sublabel}</Text>
    </group>
  );
}

function Building({ x, z, h, hue, name }: { x: number; z: number; h: number; hue: number; name: string }) {
  const color = `hsl(${hue}, 65%, 48%)`;
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, h / 2, 0]} castShadow>
        <boxGeometry args={[2.2, h, 2.2]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} metalness={0.45} roughness={0.5} />
      </mesh>
      <Text position={[0, h + 0.6, 0]} fontSize={0.28} color="#e7e7ff" anchorX="center" outlineWidth={0.02} outlineColor="#000">{name}</Text>
    </group>
  );
}

// --------- Bad-data entities (red corrupted orbs) ----------
function BadDataMesh({ x, z, hue, hpRatio }: { x: number; z: number; hue: number; hpRatio: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const color = `hsl(${hue}, 95%, 55%)`;
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.x = state.clock.elapsedTime * 1.4;
    ref.current.rotation.y = state.clock.elapsedTime * 0.9;
    ref.current.position.y = 1 + Math.sin(state.clock.elapsedTime * 3 + x) * 0.15;
  });
  return (
    <group position={[x, 0, z]}>
      <mesh ref={ref} position={[0, 1, 0]} castShadow>
        <octahedronGeometry args={[0.55, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.4} roughness={0.3} />
      </mesh>
      <pointLight color={color} intensity={1.4} distance={5} />
      {/* HP ring */}
      <mesh position={[0, 1.9, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.35, 0.42, 24, 1, 0, Math.PI * 2 * hpRatio]} />
        <meshBasicMaterial color="#ff3355" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// --------- Pickups: artifact (cyan), contract (amber), boost (violet) ----------
const PICKUP_COLOR = { artifact: "#22d3ee", contract: "#fbbf24", boost: "#a78bfa" } as const;
function PickupMesh({ x, z, kind, rarity }: { x: number; z: number; kind: keyof typeof PICKUP_COLOR; rarity: 1 | 2 | 3 }) {
  const ref = useRef<THREE.Mesh>(null);
  const color = PICKUP_COLOR[kind];
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 1.2;
    ref.current.position.y = 0.9 + Math.sin(state.clock.elapsedTime * 2 + x * 0.5) * 0.2;
  });
  const scale = 0.25 + rarity * 0.12;
  return (
    <group position={[x, 0, z]}>
      <mesh ref={ref} position={[0, 0.9, 0]} castShadow>
        {kind === "artifact" ? <tetrahedronGeometry args={[scale]} />
          : kind === "contract" ? <boxGeometry args={[scale, scale, scale]} />
          : <dodecahedronGeometry args={[scale]} />}
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.8} roughness={0.2} />
      </mesh>
      <pointLight color={color} intensity={1.0} distance={3.5} />
      <Sparkles count={rarity * 6} scale={[0.8, 1.2, 0.8]} size={2} color={color} position={[0, 1, 0]} />
    </group>
  );
}

// --------- Shot tracer ----------
function ShotTracer({ x1, z1, x2, z2, hue }: { x1: number; z1: number; x2: number; z2: number; hue: number }) {
  const ref = useRef<THREE.Group>(null);
  const color = `hsl(${hue}, 100%, 65%)`;
  const dx = x2 - x1, dz = z2 - z1;
  const len = Math.hypot(dx, dz) || 0.01;
  const yaw = Math.atan2(dx, dz);
  return (
    <group ref={ref} position={[(x1 + x2) / 2, 1.6, (z1 + z2) / 2]} rotation={[0, yaw, 0]}>
      <mesh>
        <cylinderGeometry args={[0.05, 0.05, len, 6]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}

// --------- $DAT Marketplace stall ----------
function Marketplace() {
  return (
    <group position={[0, 0, -16]}>
      <mesh position={[0, 1.2, 0]} castShadow>
        <boxGeometry args={[5, 2.4, 2]} />
        <meshStandardMaterial color="#1a103a" emissive="#7c3aed" emissiveIntensity={0.35} roughness={0.5} metalness={0.4} />
      </mesh>
      <Text position={[0, 3.0, 0]} fontSize={0.5} color="#fbbf24" outlineWidth={0.03} outlineColor="#000">$DAT MARKETPLACE</Text>
      <Text position={[0, 2.5, 0]} fontSize={0.22} color="#a78bfa" outlineWidth={0.01} outlineColor="#000">walk close to trade</Text>
      <pointLight position={[0, 3, 0]} color="#a78bfa" intensity={2.4} distance={12} />
    </group>
  );
}

// External input refs shared with touch controls
export interface InputState {
  move: { x: number; y: number };  // -1..1 (y: forward+, back-)
  look: { x: number; y: number };  // delta yaw / pitch per frame from touch pad
  fire: boolean;
  run: boolean;
}

// --------- Player with weapon firing ----------
function Player({
  onPosition, onMarketProx, input,
}: {
  onPosition: (p: THREE.Vector3) => void;
  onMarketProx: (near: boolean) => void;
  input: React.MutableRefObject<InputState>;
}) {
  const { camera } = useThree();
  const keys = useRef<Record<string, boolean>>({});
  const velocity = useRef(new THREE.Vector3());
  const fire = useGameplay((s) => s.fire);
  const collect = useGameplay((s) => s.collect);
  const fireCooldown = useRef(0);
  const pitch = useRef(0);
  const yaw = useRef(0);

  useEffect(() => {
    const d = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
      if (e.code === "Digit1") useGameplay.getState().setWeapon("pulse");
      if (e.code === "Digit2") useGameplay.getState().setWeapon("lattice");
      if (e.code === "Digit3") useGameplay.getState().setWeapon("phase");
    };
    const u = (e: KeyboardEvent) => (keys.current[e.code] = false);
    const click = () => {
      const fwd = new THREE.Vector3();
      camera.getWorldDirection(fwd);
      fire({ x: camera.position.x, z: camera.position.z }, { x: fwd.x, z: fwd.z });
    };
    window.addEventListener("keydown", d);
    window.addEventListener("keyup", u);
    window.addEventListener("mousedown", click);
    camera.position.set(0, 2, 18);
    return () => {
      window.removeEventListener("keydown", d);
      window.removeEventListener("keyup", u);
      window.removeEventListener("mousedown", click);
    };
  }, [camera, fire]);

  useFrame((_, delta) => {
    // touch look — applied directly to camera euler
    if (input.current.look.x || input.current.look.y) {
      const euler = new THREE.Euler(0, 0, 0, "YXZ");
      euler.setFromQuaternion(camera.quaternion);
      euler.y -= input.current.look.x * delta * 2.5;
      euler.x -= input.current.look.y * delta * 2.0;
      euler.x = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, euler.x));
      camera.quaternion.setFromEuler(euler);
    }

    const running = keys.current["ShiftLeft"] || input.current.run;
    const speed = (running ? 12 : 6) * delta;
    const fwd = new THREE.Vector3();
    camera.getWorldDirection(fwd);
    fwd.y = 0; fwd.normalize();
    const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
    velocity.current.set(0, 0, 0);
    if (keys.current["KeyW"]) velocity.current.add(fwd);
    if (keys.current["KeyS"]) velocity.current.sub(fwd);
    if (keys.current["KeyD"]) velocity.current.add(right);
    if (keys.current["KeyA"]) velocity.current.sub(right);
    // touch joystick
    const m = input.current.move;
    if (m.x || m.y) {
      velocity.current.add(fwd.clone().multiplyScalar(-m.y));
      velocity.current.add(right.clone().multiplyScalar(m.x));
    }
    if (velocity.current.lengthSq() > 0) velocity.current.normalize().multiplyScalar(speed);
    camera.position.add(velocity.current);
    camera.position.y = 2;
    onPosition(camera.position);
    collect({ x: camera.position.x, z: camera.position.z });
    onMarketProx(Math.hypot(camera.position.x, camera.position.z + 16) < 4.5);

    // touch fire (auto-repeat while held)
    fireCooldown.current -= delta * 1000;
    if (input.current.fire && fireCooldown.current <= 0) {
      const fwdv = new THREE.Vector3();
      camera.getWorldDirection(fwdv);
      fire({ x: camera.position.x, z: camera.position.z }, { x: fwdv.x, z: fwdv.z });
      fireCooldown.current = 140;
    }
    void pitch; void yaw;
  });
  return null;
}

// --------- Weapon viewmodel — fixed-to-camera glowing baton ----------
function WeaponViewmodel() {
  const { camera } = useThree();
  const ref = useRef<THREE.Group>(null);
  const activeWeapon = useGameplay((s) => s.activeWeapon);
  const weapons = useGameplay((s) => s.weapons);
  const w = weapons.find((x) => x.id === activeWeapon)!;
  useFrame(() => {
    if (!ref.current) return;
    ref.current.position.copy(camera.position);
    ref.current.quaternion.copy(camera.quaternion);
    ref.current.translateX(0.45); ref.current.translateY(-0.35); ref.current.translateZ(-0.85);
  });
  return (
    <group ref={ref}>
      <mesh>
        <cylinderGeometry args={[0.04, 0.06, 0.9, 8]} />
        <meshStandardMaterial color={w.color} emissive={w.color} emissiveIntensity={1.6} roughness={0.2} />
      </mesh>
      <pointLight color={w.color} intensity={0.5} distance={2} />
    </group>
  );
}

function Scene({
  onPosition, onMarketProx, input, touch,
}: {
  onPosition: (p: THREE.Vector3) => void;
  onMarketProx: (n: boolean) => void;
  input: React.MutableRefObject<InputState>;
  touch: boolean;
}) {
  const bots = useWorld((s) => s.bots);
  const worldSize = useWorld((s) => s.worldSize);
  const unlocked = useWorld((s) => s.unlocked);
  const badData = useGameplay((s) => s.badData);
  const pickups = useGameplay((s) => s.pickups);
  const shots = useGameplay((s) => s.shots);
  const tickGame = useGameplay((s) => s.tick);

  useFrame((_, delta) => {
    tickGame(delta * 1000, Math.max(20, worldSize * 0.7));
  });

  const buildings = useMemo(() => unlocked.map((u, i) => {
    const angle = i * 0.7;
    const radius = 6 + i * 1.6;
    const bt = getBreakthrough(u.id);
    return {
      x: Math.cos(angle) * radius, z: Math.sin(angle) * radius,
      h: 2 + ((i % 5) + 1) * 0.9, hue: ((bt?.tier ?? 1) * 47) % 360,
      name: bt?.name.split(" ").slice(0, 2).join(" ") ?? u.id,
    };
  }), [unlocked]);

  const groundSize = Math.max(80, worldSize * 1.6);

  return (
    <>
      <fog attach="fog" args={["#06081a", 32, 130]} />
      <color attach="background" args={["#04050d"]} />
      <Sky distance={450000} sunPosition={[10, 4, 10]} turbidity={7} rayleigh={3} mieCoefficient={0.005} mieDirectionalG={0.85} />
      <Environment preset="night" />
      <ambientLight intensity={0.28} />
      <hemisphereLight args={["#7c3aed", "#0c0c1e", 0.55]} />
      <directionalLight
        position={[20, 30, 10]} intensity={1.4} castShadow
        shadow-mapSize-width={2048} shadow-mapSize-height={2048}
        shadow-bias={-0.0005}
      />
      <Ground size={groundSize} />
      <GridLines size={groundSize} />
      <ContactShadows position={[0, 0.02, 0]} opacity={0.55} scale={groundSize * 0.5} blur={2.6} far={20} resolution={1024} />
      <Sparkles count={160} scale={[60, 18, 60]} size={1.6} color="#7c3aed" position={[0, 4, 0]} />
      {bots.map((b) => <Bot key={b.id} x={b.x} z={b.z} hue={b.hue} label={b.name} sublabel={b.role} />)}
      {buildings.map((b, i) => <Building key={i} {...b} />)}
      {badData.map((b) => <BadDataMesh key={b.id} x={b.x} z={b.z} hue={b.hue} hpRatio={b.hp / b.maxHp} />)}
      {pickups.map((p) => <PickupMesh key={p.id} x={p.x} z={p.z} kind={p.kind} rarity={p.rarity} />)}
      {shots.map((s) => <ShotTracer key={s.id} x1={s.x1} z1={s.z1} x2={s.x2} z2={s.z2} hue={s.hue} />)}
      <Marketplace />
      <Player onPosition={onPosition} onMarketProx={onMarketProx} input={input} />
      <WeaponViewmodel />
      {!touch && <PointerLockControls />}
      <EffectComposer multisampling={0}>
        <SMAA />
        <Bloom intensity={0.9} luminanceThreshold={0.35} luminanceSmoothing={0.85} mipmapBlur radius={0.85} />
        <ChromaticAberration blendFunction={BlendFunction.NORMAL} offset={[0.0006, 0.0009]} radialModulation={false} modulationOffset={0} />
        <BrightnessContrast brightness={0.02} contrast={0.12} />
        <Vignette eskil={false} offset={0.18} darkness={0.85} />
      </EffectComposer>
    </>
  );
}

// =====================================================================
// HUD + page
// =====================================================================
function WorldPage() {
  const init = useWorld((s) => s.init);
  const startLoop = useWorld((s) => s.startLoop);
  const reset = useWorld((s) => s.reset);
  const research = useWorld((s) => s.researchPoints);
  const total = useWorld((s) => s.totalResearch);
  const unlocked = useWorld((s) => s.unlocked);
  const worldSize = useWorld((s) => s.worldSize);
  const bots = useWorld((s) => s.bots);
  const healBot = useWorld((s) => s.healBot);
  const healAllBots = useWorld((s) => s.healAllBots);

  const initGame = useGameplay((s) => s.init);
  const weapons = useGameplay((s) => s.weapons);
  const activeWeapon = useGameplay((s) => s.activeWeapon);
  const setWeapon = useGameplay((s) => s.setWeapon);
  const unlockWeapon = useGameplay((s) => s.unlockWeapon);
  const inventory = useGameplay((s) => s.inventory);
  const sellArtifact = useGameplay((s) => s.sellArtifact);
  const activateBoost = useGameplay((s) => s.activateBoost);
  const boost = useGameplay((s) => s.boost);
  const kills = useGameplay((s) => s.kills);
  const cleaned = useGameplay((s) => s.cleaned);
  const collected = useGameplay((s) => s.collected);

  const [hint, setHint] = useState(true);
  const [dat, setDat] = useState<number>(() => readDat());
  const [capHours, setCapHours] = useState<number>(() => getOfflineCapHours());
  const [panelOpen, setPanelOpen] = useState(false);
  const [swarmOpen, setSwarmOpen] = useState(false);
  const [bagOpen, setBagOpen] = useState(false);
  const [marketOpen, setMarketOpen] = useState(false);
  const [marketNear, setMarketNear] = useState(false);
  const [pos, setPos] = useState({ x: 0, z: 18 });
  const [uploadOpen, setUploadOpen] = useState(false);
  const [discoveries, setDiscoveries] = useState<Discovery[]>(() => readDiscoveries());

  const touch = useIsTouch();
  const input = useRef<InputState>({
    move: { x: 0, y: 0 }, look: { x: 0, y: 0 }, fire: false, run: false,
  });
  const onMove = useCallback((v: { x: number; y: number }) => { input.current.move = v; }, []);
  const onLook = useCallback((v: { x: number; y: number }) => { input.current.look = v; }, []);

  useEffect(() => {
    init();
    initGame();
    const stop = startLoop();
    const unsub = subscribeDat(setDat);
    const unsubD = subscribeDiscoveries(() => setDiscoveries(readDiscoveries()));
    return () => { stop(); unsub(); unsubD(); };
  }, [init, initGame, startLoop]);

  const cost = nextCost(unlocked.length);
  const pct = Math.min(100, (research / cost) * 100);
  const latest = unlocked[unlocked.length - 1];
  const latestBt = latest ? getBreakthrough(latest.id) : null;

  const activeW = weapons.find((w) => w.id === activeWeapon)!;
  const boostMs = boost ? Math.max(0, boost.expiresAt - Date.now()) : 0;

  const handleUpload = async (files: FileList | null) => {
    if (!files) return;
    for (const f of Array.from(files)) {
      await ingestFile(f, "operator-discovery");
    }
    setDiscoveries(readDiscoveries());
    creditDat(10 * files.length);
  };

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black text-white">
      <Canvas shadows dpr={[1, 2]} camera={{ fov: 72, near: 0.1, far: 2000 }} onClick={() => setHint(false)}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2, powerPreference: "high-performance" }}>
        <Suspense fallback={null}>
          <Scene
            onPosition={(p) => setPos({ x: p.x, z: p.z })}
            onMarketProx={setMarketNear}
            input={input}
            touch={touch}
          />
        </Suspense>
      </Canvas>

      {/* TOUCH CONTROLS — only on touch devices */}
      {touch && (
        <>
          <TouchJoystick side="left" onChange={onMove} label="WALK" />
          <TouchJoystick side="right" onChange={onLook} label="LOOK" />
          <TouchButton
            side="right" bottom={150} label="FIRE" color="#22d3ee"
            onPress={() => (input.current.fire = true)}
            onRelease={() => (input.current.fire = false)}
          />
          <TouchButton
            side="left" bottom={150} label="RUN" color="#a78bfa"
            onPress={() => (input.current.run = true)}
            onRelease={() => (input.current.run = false)}
          />
        </>
      )}

      {/* CROSSHAIR */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="relative h-4 w-4">
          <div className="absolute inset-x-0 top-1/2 h-px bg-cyan-400/70" />
          <div className="absolute inset-y-0 left-1/2 w-px bg-cyan-400/70" />
          <div className="absolute inset-0 rounded-full border border-cyan-400/40" />
        </div>
      </div>

      {/* HUD */}
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4 font-mono text-xs">
        <div className="flex items-start justify-between gap-3">
          <div className="pointer-events-auto rounded-sm border border-white/15 bg-black/55 px-3 py-2 backdrop-blur-sm">
            <div className="text-[10px] uppercase tracking-[0.25em] text-chrome">Quantara World · explore mode</div>
            <div className="mt-1 text-[10px] text-amber-300/80">Simulation — click to fire · pickups auto-collect.</div>
            <div className="mt-1 text-[10px] text-cyan-300/80">pos ({pos.x.toFixed(1)}, {pos.z.toFixed(1)})</div>
          </div>
          <div className="pointer-events-auto flex flex-col gap-2">
            <div className="rounded-sm border border-emerald-400/30 bg-black/55 px-3 py-2 text-right">
              <div className="text-[9px] uppercase tracking-[0.25em] text-emerald-300/80">$DAT balance</div>
              <div className="text-base font-bold text-emerald-200">{dat.toLocaleString()}</div>
              <div className="text-[9px] text-muted-foreground">cleaned {cleaned} · kills {kills}</div>
            </div>
            <Link to="/world/ledger" className="rounded-sm border border-accent/40 bg-black/55 px-3 py-2 text-[10px] uppercase tracking-[0.25em] text-white hover:bg-accent/15">
              Open Ledger ({unlocked.length})
            </Link>
            <button onClick={() => setBagOpen((v) => !v)} className="rounded-sm border border-amber-400/40 bg-black/55 px-3 py-2 text-[10px] uppercase tracking-[0.25em] text-amber-200 hover:bg-amber-500/10">
              {bagOpen ? "Close inventory" : `Inventory (${inventory.length})`}
            </button>
            <button onClick={() => setMarketOpen((v) => !v)} className={`rounded-sm border px-3 py-2 text-[10px] uppercase tracking-[0.25em] hover:bg-white/10 ${marketNear ? "border-fuchsia-400/60 bg-fuchsia-500/10 text-fuchsia-200 animate-pulse" : "border-white/15 bg-black/55 text-white"}`}>
              {marketNear ? "▶ Trade @ Market" : "Marketplace"}
            </button>
            <button onClick={() => setPanelOpen((v) => !v)} className="rounded-sm border border-white/15 bg-black/55 px-3 py-2 text-[10px] uppercase tracking-[0.25em] text-white hover:bg-white/10">
              {panelOpen ? "Close panel" : "World panel"}
            </button>
            <button onClick={() => setSwarmOpen((v) => !v)} className="rounded-sm border border-cyan-400/40 bg-black/55 px-3 py-2 text-[10px] uppercase tracking-[0.25em] text-cyan-200 hover:bg-cyan-500/10">
              {swarmOpen ? "Close swarm" : "Self-healing swarm"}
            </button>
            <button onClick={() => setUploadOpen((v) => !v)} className="rounded-sm border border-emerald-400/40 bg-black/55 px-3 py-2 text-[10px] uppercase tracking-[0.25em] text-emerald-200 hover:bg-emerald-500/10">
              {uploadOpen ? "Close uploads" : `Upload discovery (${discoveries.length})`}
            </button>
            <Link to="/" className="rounded-sm border border-white/15 bg-black/55 px-3 py-2 text-[10px] uppercase tracking-[0.25em] text-white hover:bg-white/10">
              ← Back to main site
            </Link>
            <button onClick={() => { if (confirm("Reset Quantara World? All unlocks will be lost.")) reset(); }}
              className="rounded-sm border border-red-500/30 bg-black/55 px-3 py-2 text-[10px] uppercase tracking-[0.25em] text-red-300 hover:bg-red-500/10">
              Reset world
            </button>
          </div>
        </div>

        {/* WEAPON BAR */}
        <div className="pointer-events-auto absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-2 rounded-sm border border-white/15 bg-black/70 p-2 backdrop-blur-md">
          {weapons.map((w, i) => {
            const active = w.id === activeWeapon;
            return (
              <button
                key={w.id}
                onClick={() => (w.unlocked ? setWeapon(w.id) : unlockWeapon(w.id))}
                className={`relative flex w-28 flex-col items-center rounded-sm border px-2 py-1.5 text-[10px] uppercase tracking-[0.15em] transition ${
                  active ? "border-white bg-white/10" : w.unlocked ? "border-white/20 hover:border-white/40" : "border-amber-400/40 hover:bg-amber-500/10"
                }`}
                style={active ? { boxShadow: `0 0 18px -4px ${w.color}` } : undefined}
              >
                <span className="text-[9px] text-chrome">{i + 1}</span>
                <span style={{ color: w.color }} className="text-[11px] font-bold">{w.name}</span>
                <span className="text-[9px] text-muted-foreground">
                  {w.unlocked ? `${w.damage} dmg · ${w.range}m` : `🔒 ${w.cost} $DAT`}
                </span>
              </button>
            );
          })}
        </div>

        {/* ACTIVE BOOST */}
        {boost && (
          <div className="pointer-events-none absolute bottom-44 left-1/2 -translate-x-1/2 rounded-sm border border-violet-400/50 bg-violet-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-violet-200">
            ⚡ {boost.label} · {(boostMs / 1000).toFixed(0)}s
          </div>
        )}

        {/* INVENTORY PANEL */}
        {bagOpen && (
          <div className="pointer-events-auto absolute right-4 top-44 max-h-[70vh] w-80 overflow-y-auto rounded-sm border border-amber-400/30 bg-black/85 p-4 backdrop-blur-md">
            <div className="text-[10px] uppercase tracking-[0.25em] text-amber-300">Inventory · {inventory.length} items</div>
            {inventory.length === 0 && <div className="mt-3 text-[10px] text-muted-foreground">// empty — walk to glowing pickups</div>}
            <div className="mt-3 space-y-2">
              {inventory.map((e) => (
                <InventoryRow key={e.id} entry={e} onSell={sellArtifact} onActivate={activateBoost} />
              ))}
            </div>
          </div>
        )}

        {/* MARKETPLACE PANEL */}
        {marketOpen && (
          <div className="pointer-events-auto absolute left-1/2 top-24 w-[28rem] -translate-x-1/2 rounded-sm border border-fuchsia-400/40 bg-black/90 p-4 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-[0.25em] text-fuchsia-300">$DAT Marketplace</div>
              <button onClick={() => setMarketOpen(false)} className="text-[10px] text-chrome hover:text-white">✕</button>
            </div>
            <div className="mt-2 text-[10px] text-muted-foreground">
              {marketNear ? "Trader online · sovereign rate" : "Walk closer to the stall for live pricing."}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
              <div className="border border-white/10 p-2">
                <div className="uppercase tracking-[0.2em] text-chrome">Quick sell</div>
                <button
                  disabled={!inventory.some((i) => i.kind !== "boost")}
                  onClick={() => inventory.filter((i) => i.kind !== "boost").forEach((i) => sellArtifact(i.id))}
                  className="mt-2 w-full border border-emerald-400/40 px-2 py-1 text-emerald-300 hover:bg-emerald-400/10 disabled:opacity-30"
                >
                  Sell all artifacts + contracts
                </button>
              </div>
              <div className="border border-white/10 p-2">
                <div className="uppercase tracking-[0.2em] text-chrome">Bounty crate</div>
                <button onClick={() => { if (dat >= 25) { writeDat(readDat() - 25); const r = Math.floor(20 + Math.random() * 60); creditDat(r); } }}
                  className="mt-2 w-full border border-amber-400/40 px-2 py-1 text-amber-200 hover:bg-amber-400/10 disabled:opacity-30"
                  disabled={dat < 25}>
                  Open · 25 $DAT
                </button>
              </div>
              <div className="col-span-2 border border-white/10 p-2">
                <div className="uppercase tracking-[0.2em] text-chrome">Unlock arsenal</div>
                <div className="mt-2 flex flex-col gap-1">
                  {weapons.filter((w) => !w.unlocked).map((w) => (
                    <button key={w.id} disabled={dat < w.cost}
                      onClick={() => unlockWeapon(w.id)}
                      className="flex items-center justify-between border border-white/15 px-2 py-1 hover:bg-white/5 disabled:opacity-30"
                      style={{ color: w.color }}>
                      <span>{w.name}</span><span>{w.cost} $DAT</span>
                    </button>
                  ))}
                  {weapons.every((w) => w.unlocked) && <div className="text-[10px] text-emerald-300">// arsenal fully unlocked</div>}
                </div>
              </div>
            </div>
          </div>
        )}

        {panelOpen && (
          <div className="pointer-events-auto absolute right-4 top-[28rem] w-72 rounded-sm border border-white/15 bg-black/80 p-4 backdrop-blur-md">
            <div className="text-[10px] uppercase tracking-[0.25em] text-chrome">World panel</div>
            <div className="mt-3 space-y-3 text-[11px]">
              <div className="grid grid-cols-2 gap-2">
                <Stat k="Bots" v={String(bots.length)} />
                <Stat k="Unlocked" v={String(unlocked.length)} />
                <Stat k="Cleaned" v={String(cleaned)} />
                <Stat k="Collected" v={String(collected)} />
                <Stat k="Research" v={research.toFixed(0)} />
                <Stat k="World" v={worldSize.toFixed(0)} />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-[0.25em] text-chrome">
                  Offline replay cap: {capHours >= 1 ? `${capHours}h` : `${(capHours * 60).toFixed(0)}m`}
                </label>
                <input type="range" min={0.25} max={720} step={0.25} value={capHours}
                  onChange={(e) => setCapHours(setOfflineCapHours(parseFloat(e.target.value)))}
                  className="mt-2 w-full accent-emerald-400" />
                <div className="mt-1 flex gap-1">
                  {[1, 24, 168, 720].map((h) => (
                    <button key={h} onClick={() => setCapHours(setOfflineCapHours(h))}
                      className="flex-1 border border-white/15 px-1 py-0.5 text-[9px] uppercase tracking-[0.15em] hover:bg-white/10">
                      {h < 24 ? `${h}h` : `${h / 24}d`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {swarmOpen && (
          <div className="pointer-events-auto absolute left-4 top-44 max-h-[70vh] w-80 overflow-y-auto rounded-sm border border-cyan-400/30 bg-black/85 p-4 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-[0.25em] text-cyan-300">Self-Healing Swarm</div>
              <button onClick={healAllBots} className="rounded-sm border border-cyan-400/40 px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] text-cyan-200 hover:bg-cyan-500/15">
                Heal all
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {bots.map((b) => {
                const phase = b.phaseCorrection ?? 1.0;
                const pctPhase = Math.round(phase * 100);
                const ok = phase >= 0.85;
                return (
                  <div key={b.id} className="rounded-sm border border-white/10 bg-black/40 p-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[11px] font-bold text-white">{b.name}</div>
                        <div className="text-[9px] uppercase tracking-[0.2em] text-chrome">{b.role}</div>
                      </div>
                      <button onClick={() => healBot(b.id)} className="rounded-sm border border-white/20 px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] text-white hover:bg-white/10">
                        Heal
                      </button>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-sm bg-white/10">
                      <div className={`h-full transition-all ${ok ? "bg-cyan-400" : "bg-amber-400"}`} style={{ width: `${pctPhase}%` }} />
                    </div>
                    <div className="mt-0.5 flex justify-between text-[9px] text-muted-foreground">
                      <span>phase {pctPhase}%</span>
                      <span className={b.healingActive ? "text-cyan-300" : ""}>{b.healingActive ? "HEALING" : ok ? "stable" : "drift"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {uploadOpen && (
          <div className="pointer-events-auto absolute left-1/2 top-24 w-[30rem] max-w-[95vw] -translate-x-1/2 rounded-sm border border-emerald-400/40 bg-black/90 p-4 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-[0.25em] text-emerald-300">▌ Operator Discoveries</div>
              <button onClick={() => setUploadOpen(false)} className="text-[10px] text-chrome hover:text-white">✕</button>
            </div>
            <label className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-sm border border-dashed border-emerald-400/40 bg-emerald-400/5 px-4 py-6 text-center hover:bg-emerald-400/10">
              <input
                type="file" multiple accept=".md,.txt,.json,.csv,.tex,.log,text/*,application/json"
                onChange={(e) => { handleUpload(e.target.files); e.target.value = ""; }}
                className="sr-only"
              />
              <div className="text-[11px] font-bold text-emerald-200">drop / pick files to ingest</div>
              <div className="mt-1 text-[9px] uppercase tracking-[0.25em] text-emerald-300/70">md · txt · json · csv · up to 1.5 MB · stays local</div>
              <div className="mt-2 text-[9px] text-amber-200">+10 $DAT awarded per discovery</div>
            </label>
            <div className="mt-3 max-h-60 space-y-1 overflow-y-auto">
              {discoveries.length === 0 && (
                <div className="text-[10px] text-muted-foreground">// no discoveries yet — upload findings to seal them into the ledger</div>
              )}
              {discoveries.slice().reverse().map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded-sm border border-white/10 bg-black/40 px-2 py-1 text-[10px]">
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="truncate text-emerald-200">{d.name}</div>
                    <div className="text-[9px] text-chrome">{(d.size / 1024).toFixed(1)} KB · {new Date(d.uploadedAt).toLocaleString()}</div>
                  </div>
                  <button onClick={() => { removeDiscovery(d.id); setDiscoveries(readDiscoveries()); }}
                    className="border border-rose-400/40 px-2 py-0.5 text-[9px] text-rose-300 hover:bg-rose-400/10">DEL</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {hint && (
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-sm border border-white/20 bg-black/70 px-5 py-4 text-center backdrop-blur-sm">
            <div className="text-[10px] uppercase tracking-[0.3em] text-chrome">{touch ? "Tap to dive in" : "Click to enter explore mode"}</div>
            <div className="mt-2 text-[11px] text-white">{touch ? "Left stick walk · Right stick look · FIRE button shoots" : "WASD walk · mouse look · Shift run · Esc release"}</div>
            <div className="mt-1 text-[11px] text-cyan-300">CLICK to fire · 1·2·3 swap weapons</div>
            <div className="mt-1 text-[10px] text-amber-300">walk over glowing pickups to loot · go south to marketplace</div>
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
            <div className="text-[10px] uppercase tracking-[0.25em] text-chrome">Active weapon</div>
            <div className="mt-1 text-sm font-bold" style={{ color: activeW.color }}>{activeW.name}</div>
            <div className="text-[10px] text-muted-foreground">{activeW.damage} damage · cooldown {activeW.cooldownMs}ms · range {activeW.range}m</div>
          </div>
          <div className="rounded-sm border border-white/10 bg-black/55 p-3 backdrop-blur-sm">
            <div className="text-[10px] uppercase tracking-[0.25em] text-chrome">Latest unlock</div>
            <div className="mt-1 text-sm font-bold text-white">{latestBt ? latestBt.name : "—"}</div>
            <div className="text-[10px] text-muted-foreground">
              {latest ? `by ${latest.discoveredBy} · ${new Date(latest.unlockedAt).toLocaleString()}` : "no discoveries yet"} · total {total.toFixed(0)} pts
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function InventoryRow({ entry, onSell, onActivate }: { entry: InventoryEntry; onSell: (id: string) => number; onActivate: (id: string) => boolean }) {
  const color = entry.kind === "artifact" ? "#22d3ee" : entry.kind === "contract" ? "#fbbf24" : "#a78bfa";
  const rarityLabel = ["", "common", "rare", "legendary"][entry.rarity];
  return (
    <div className="flex items-center justify-between rounded-sm border border-white/10 bg-black/40 p-2">
      <div>
        <div className="text-[11px] font-bold" style={{ color }}>{entry.label}</div>
        <div className="text-[9px] uppercase tracking-[0.2em] text-chrome">{entry.kind} · {rarityLabel}</div>
      </div>
      {entry.kind === "boost" ? (
        <button onClick={() => onActivate(entry.id)} className="rounded-sm border border-violet-400/40 px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] text-violet-200 hover:bg-violet-500/10">
          Activate
        </button>
      ) : (
        <button onClick={() => onSell(entry.id)} className="rounded-sm border border-emerald-400/40 px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] text-emerald-200 hover:bg-emerald-500/10">
          Sell · {entry.value} $DAT
        </button>
      )}
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="border border-white/10 bg-black/50 p-2">
      <div className="text-[9px] uppercase tracking-[0.2em] text-chrome">{k}</div>
      <div className="text-sm font-bold text-white">{v}</div>
    </div>
  );
}
