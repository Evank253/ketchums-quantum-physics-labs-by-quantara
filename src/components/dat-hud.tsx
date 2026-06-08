import { useEffect, useState } from "react";
import { readDat, subscribeDat } from "@/lib/dat-tokens";
import { subscribeAchievements, ACHIEVEMENTS, getUnlocked } from "@/lib/achievements";

export function DatHud() {
  const [dat, setDat] = useState(0);
  const [unlocked, setUnlocked] = useState<Record<string, number>>({});
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    setDat(readDat());
    setUnlocked(getUnlocked());
    const offD = subscribeDat((v) => {
      setDat(v);
      setFlash(true);
      setTimeout(() => setFlash(false), 600);
    });
    const offA = subscribeAchievements(setUnlocked);
    return () => { offD(); offA(); };
  }, []);

  const total = ACHIEVEMENTS.length;
  const got = Object.keys(unlocked).length;

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex items-center gap-2 rounded-full border border-amber-400/40 bg-black/70 px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest text-amber-200 shadow-[0_0_24px_rgba(255,200,80,0.25)] backdrop-blur">
      <span className={`inline-block h-2 w-2 rounded-full bg-amber-300 transition-all ${flash ? "scale-150 shadow-[0_0_10px_#fcd34d]" : ""}`} />
      <span>$DAT</span>
      <span className="text-amber-100">{dat.toLocaleString()}</span>
      <span className="text-white/30">·</span>
      <span className="text-violet-200">{got}/{total} ★</span>
    </div>
  );
}
