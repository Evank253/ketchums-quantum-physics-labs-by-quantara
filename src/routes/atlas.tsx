/**
 * /atlas — The 4D Research Atlas.
 * Ported from Quantara-4D (github.com/Evank253/Quantara-4D) and wired to
 * the live 3D world-store so unlocks in the 3D world project footprints
 * into the 4D Atlas in real time.
 *
 * Separation Law: this route READS unlocks from the 3D world. It never
 * writes back. Only humans observe both layers.
 */

import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { useEffect, useMemo, useState, Suspense } from "react";
import {
  ATLAS_NODES,
  getUnlockedNodes,
  getLockedNodes,
  type AtlasNode,
  type Programme,
} from "@/lib/atlas";
import { useWorld } from "@/lib/world-store";

export const Route = createFileRoute("/atlas")({
  component: AtlasPage,
  head: () => ({
    meta: [
      { title: "4D Research Atlas — Quantara" },
      {
        name: "description",
        content:
          "The 4D Research Atlas: locked research nodes unlock as the 3D Quantara world produces digital footprints.",
      },
    ],
  }),
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="min-h-screen grid place-items-center bg-black text-white p-8">
        <div className="max-w-md text-center space-y-3">
          <h2 className="text-xl font-semibold">Atlas failed to load</h2>
          <pre className="text-xs text-red-300 whitespace-pre-wrap">{String(error)}</pre>
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="px-3 py-1.5 rounded border border-cyan-500/40 text-cyan-300 text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  },
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center bg-black text-white">
      Not found
    </div>
  ),
});

const PROGRAMME_COLORS: Record<Programme, string> = {
  perturbative: "#00e5ff",
  closed_form: "#7c3aed",
  lattice: "#10b981",
  SMEFT: "#f59e0b",
  prediction: "#ef4444",
  data: "#6366f1",
};

const PROGRAMME_ORDER: Programme[] = [
  "perturbative",
  "closed_form",
  "lattice",
  "SMEFT",
  "prediction",
  "data",
];
const DOMAIN_ORDER = ["QED", "QCD", "GR", "CondMat", "Info"];

function AtlasNodeMesh({
  node,
  locked,
  onClick,
}: {
  node: AtlasNode;
  locked: boolean;
  onClick: (n: AtlasNode) => void;
}) {
  const x = (PROGRAMME_ORDER.indexOf(node.programme) - 2.5) * 4;
  const z = (DOMAIN_ORDER.indexOf(node.domain) - 2) * 4;
  const y = node.difficulty * 0.8 - 4;
  const color = locked ? "#374151" : PROGRAMME_COLORS[node.programme];
  return (
    <mesh position={[x, y, z]} onClick={() => !locked && onClick(node)}>
      <sphereGeometry args={[locked ? 0.35 : 0.55, 24, 24]} />
      <meshStandardMaterial
        color={color}
        emissive={locked ? "#000" : color}
        emissiveIntensity={locked ? 0 : 0.6}
        opacity={locked ? 0.35 : 1}
        transparent
      />
    </mesh>
  );
}

/**
 * Bridge: convert the 3D world's unlock events into the canonical
 * BREAKTHROUGH-* footprint IDs the Atlas catalog gates on. As the live
 * world accumulates more unlocks, more atlas nodes become reachable.
 */
function deriveFootprintIds(unlockCount: number, hasHealed: boolean): string[] {
  const seeds: string[] = [];
  if (hasHealed || unlockCount >= 1) seeds.push("BREAKTHROUGH-01-SELF-HEALING-SWARM");
  if (unlockCount >= 2) seeds.push("BREAKTHROUGH-02-QED-CONVERGENCE");
  if (unlockCount >= 4) seeds.push("BREAKTHROUGH-03-MOBILE-ENGINEERING");
  if (unlockCount >= 8) seeds.push("BREAKTHROUGH-04-MULTIVERSAL-BLUEPRINT");
  return seeds;
}

function AtlasPage() {
  const { unlocked, bots, init, startLoop } = useWorld();
  const [epoch, setEpoch] = useState(5);
  const [filter, setFilter] = useState<Programme | "all">("all");
  const [selected, setSelected] = useState<AtlasNode | null>(null);

  useEffect(() => {
    init();
    const stop = startLoop();
    return stop;
  }, [init, startLoop]);

  const hasHealed = bots.some((b) => b.healingActive);
  const footprintIds = useMemo(
    () => deriveFootprintIds(unlocked.length, hasHealed),
    [unlocked.length, hasHealed],
  );

  const unlockedNodes = getUnlockedNodes(footprintIds, epoch);
  const lockedNodes = getLockedNodes(footprintIds, epoch);
  const visibleUnlocked =
    filter === "all" ? unlockedNodes : unlockedNodes.filter((n) => n.programme === filter);
  const visibleLocked =
    filter === "all" ? lockedNodes : lockedNodes.filter((n) => n.programme === filter);

  const programmes: (Programme | "all")[] = [
    "all",
    ...PROGRAMME_ORDER,
  ];

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      <Canvas camera={{ position: [0, 8, 20], fov: 60 }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.3} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <Stars radius={80} depth={50} count={3000} factor={3} />
          {visibleUnlocked.map((n) => (
            <AtlasNodeMesh key={n.id} node={n} locked={false} onClick={setSelected} />
          ))}
          {visibleLocked.map((n) => (
            <AtlasNodeMesh key={n.id} node={n} locked onClick={() => {}} />
          ))}
          <OrbitControls enablePan enableZoom enableRotate />
        </Suspense>
      </Canvas>

      <div className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-[0.05]"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.7'/%3E%3C/svg%3E\")" }} />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-center">
          <h1 className="text-white text-2xl font-bold tracking-widest">
            4D RESEARCH ATLAS
          </h1>
          <p className="text-gray-400 text-xs mt-1">
            Space and time as dynamic matter states — Evan Ketchum, 2026
          </p>
        </div>

        <div className="absolute top-20 left-4 bg-black/70 border border-cyan-500/30 rounded-lg p-4 text-white w-64 pointer-events-auto">
          <div className="text-cyan-400 font-bold text-sm mb-3">ATLAS STATUS</div>
          <div className="text-xs space-y-1 mb-4">
            <div>
              3D Footprints received:{" "}
              <span className="text-cyan-300">{footprintIds.length}</span>
            </div>
            <div>
              Nodes unlocked:{" "}
              <span className="text-green-300">{unlockedNodes.length}</span> /{" "}
              {ATLAS_NODES.length}
            </div>
            <div>
              World unlocks: <span className="text-purple-300">{unlocked.length}</span>
            </div>
            <div>
              Current epoch: <span className="text-purple-300">{epoch}</span>
            </div>
          </div>

          <div className="mb-4">
            <label className="text-xs text-gray-400 block mb-1">
              Epoch (research depth): {epoch}
            </label>
            <input
              type="range"
              min={1}
              max={20}
              value={epoch}
              onChange={(e) => setEpoch(Number(e.target.value))}
              className="w-full accent-cyan-400"
            />
          </div>

          <div>
            <div className="text-xs text-gray-400 mb-1">Programme filter:</div>
            <div className="flex flex-wrap gap-1">
              {programmes.map((p) => (
                <button
                  key={p}
                  onClick={() => setFilter(p)}
                  className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                    filter === p
                      ? "bg-cyan-700 border-cyan-400 text-white"
                      : "bg-black/40 border-gray-600 text-gray-400 hover:border-gray-400"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 text-xs flex gap-3">
            <Link to="/world" className="text-cyan-300 hover:underline">
              ← 3D World
            </Link>
            <Link to="/synthesis" className="text-purple-300 hover:underline">
              Synthesis
            </Link>
          </div>
        </div>

        {selected && (
          <div className="absolute top-20 right-4 bg-black/70 border border-purple-500/30 rounded-lg p-4 text-white w-72 pointer-events-auto">
            <div className="flex items-center justify-between mb-2">
              <div className="text-purple-300 font-bold text-sm">{selected.label}</div>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-500 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>
            <div className="text-xs space-y-2">
              <div>
                <span className="text-gray-400">Programme: </span>
                <span className="text-cyan-300">{selected.programme}</span>
              </div>
              <div>
                <span className="text-gray-400">Domain: </span>
                <span className="text-cyan-300">{selected.domain}</span>
              </div>
              <div>
                <span className="text-gray-400">Difficulty: </span>
                <span className="text-yellow-300">{selected.difficulty}/10</span>
              </div>
              <div>
                <span
                  className={`px-2 py-0.5 rounded text-xs ${
                    selected.realityTag === "established"
                      ? "bg-green-900/40 text-green-300"
                      : selected.realityTag === "frontier"
                        ? "bg-yellow-900/40 text-yellow-300"
                        : "bg-red-900/40 text-red-300"
                  }`}
                >
                  {selected.realityTag.toUpperCase()}
                </span>
              </div>
              <p className="text-gray-300 leading-relaxed">{selected.description}</p>
              {selected.references.length > 0 && (
                <div>
                  <div className="text-gray-500 mt-2 mb-1">References:</div>
                  {selected.references.map((r, i) => (
                    <div key={i} className="text-gray-500 text-xs leading-snug">
                      {r}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center px-4">
          <p className="text-gray-600 text-xs">
            Multiversal Separation Law: 4D bots study; they do not discover. Only
            humans see both layers. Creator: Evan Ketchum, 2026.
          </p>
        </div>
      </div>
    </div>
  );
}
