// Solved-theory archive: writes to localStorage immediately AND fires an
// insert into Lovable Cloud (public.solved_theories). Read merges both.
import { supabase } from "@/integrations/supabase/client";
import { getOperator, stampNow } from "@/lib/operator-identity";

export type ArchivedSolve = {
  id: string;
  theory: string;
  solver: string;
  abstract: string;
  math: string;
  transcript: string;
  source: string;
  created_at: string;
};

const LS_KEY = "quantara.solved-archive.v1";

function dedupe(list: ArchivedSolve[]): ArchivedSolve[] {
  const byKey = new Map<string, ArchivedSolve>();
  for (const e of list) {
    const k = (e.theory || "").trim().toLowerCase();
    if (!k) continue;
    const prev = byKey.get(k);
    if (!prev || new Date(e.created_at).getTime() > new Date(prev.created_at).getTime()) {
      byKey.set(k, e);
    }
  }
  return Array.from(byKey.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

function readLocal(): ArchivedSolve[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    const arr = raw ? (JSON.parse(raw) as ArchivedSolve[]) : [];
    return dedupe(Array.isArray(arr) ? arr : []);
  } catch {
    return [];
  }
}

function writeLocal(list: ArchivedSolve[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(dedupe(list).slice(0, 200)));
  } catch {}
}

export function localSolves(): ArchivedSolve[] {
  return readLocal();
}

export async function saveSolve(input: {
  theory: string;
  solver?: string;
  abstract?: string;
  math?: string;
  transcript?: string;
  source?: string;
}): Promise<ArchivedSolve> {
  const entry: ArchivedSolve = {
    id: `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    theory: (input.theory || "Untitled solve").slice(0, 500),
    solver: (input.solver || getOperator()).slice(0, 200),
    abstract: (input.abstract || "").slice(0, 4000),
    math: (input.math || "").slice(0, 16000),
    transcript: (input.transcript || "").slice(0, 32000),
    source: (input.source || "web").slice(0, 60),
    created_at: stampNow(),
  };
  // localStorage first — instant
  const list = readLocal();
  writeLocal([entry, ...list]);

  // best-effort DB insert
  try {
    const { data, error } = await supabase
      .from("solved_theories")
      .upsert(
        {
          theory: entry.theory,
          solver: entry.solver,
          abstract: entry.abstract || null,
          math: entry.math || null,
          transcript: entry.transcript || null,
          source: entry.source,
        },
        { onConflict: "theory" },
      )
      .select()
      .single();
    if (!error && data) {
      // upgrade local entry's id to the DB id
      const upgraded: ArchivedSolve = {
        ...entry,
        id: data.id,
        created_at: data.created_at,
      };
      const cur = readLocal();
      writeLocal([upgraded, ...cur.filter((e) => e.id !== entry.id)]);
      return upgraded;
    }
  } catch {
    // offline / RLS — local copy already saved
  }
  return entry;
}

export async function fetchArchive(): Promise<ArchivedSolve[]> {
  try {
    const { data, error } = await supabase
      .from("solved_theories")
      .select("id, theory, solver, abstract, math, transcript, source, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error || !data) return [];
    return data as ArchivedSolve[];
  } catch {
    return [];
  }
}

export async function mergedArchive(): Promise<ArchivedSolve[]> {
  const [remote, local] = await Promise.all([fetchArchive(), Promise.resolve(readLocal())]);
  return dedupe([...remote, ...local]);
}
