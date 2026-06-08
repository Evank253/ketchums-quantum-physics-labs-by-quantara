import { useEffect, useState } from "react";
import { ACHIEVEMENTS, subscribeAchievements, getUnlocked } from "@/lib/achievements";

const TIER_COLOR: Record<string, string> = {
  bronze: "border-amber-700/50 text-amber-300",
  silver: "border-zinc-300/40 text-zinc-200",
  gold: "border-yellow-300/60 text-yellow-200",
  mythic: "border-fuchsia-400/60 text-fuchsia-200 shadow-[0_0_24px_rgba(232,121,249,0.25)]",
};

export function AchievementsPanel() {
  const [unlocked, setUnlocked] = useState<Record<string, number>>({});
  useEffect(() => {
    setUnlocked(getUnlocked());
    return subscribeAchievements(setUnlocked);
  }, []);
  const got = Object.keys(unlocked).length;
  const pct = Math.round((got / ACHIEVEMENTS.length) * 100);

  return (
    <section id="achievements" className="border-t border-white/5 px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-end justify-between gap-6">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-chrome">Operator Record</div>
            <h3 className="mt-2 text-3xl font-black tracking-[-0.03em] text-white md:text-5xl">Achievements</h3>
          </div>
          <div className="text-right font-mono text-[10px] uppercase tracking-widest text-white/60">
            <div>{got}/{ACHIEVEMENTS.length} unlocked</div>
            <div className="mt-1 h-1 w-40 overflow-hidden rounded-full bg-white/10">
              <div className="h-full bg-gradient-to-r from-amber-300 to-fuchsia-400 transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ACHIEVEMENTS.map((a) => {
            const got = !!unlocked[a.id];
            return (
              <div key={a.id}
                className={`rounded-md border bg-white/[0.02] p-4 transition-all ${got ? TIER_COLOR[a.tier] : "border-white/10 text-white/40"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-widest opacity-70">{a.tier}</div>
                    <div className="mt-1 text-base font-bold">{a.title}</div>
                  </div>
                  <div className={`font-mono text-[10px] ${got ? "text-amber-200" : "text-white/30"}`}>
                    {got ? "★" : "○"} +{a.reward}
                  </div>
                </div>
                <p className="mt-2 text-xs leading-relaxed opacity-80">{a.desc}</p>
                {got && (
                  <div className="mt-2 font-mono text-[10px] opacity-60">
                    unlocked · {new Date(unlocked[a.id]).toLocaleString()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
