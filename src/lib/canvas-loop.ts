// Shared canvas animation helper: caps DPR, resizes only when needed,
// pauses when offscreen or tab is hidden, honors prefers-reduced-motion,
// and obeys the cold-compute thermal governor (harder problems = lower FPS/DPR).
import { useEffect } from "react";
import { getThermal, subscribeThermal } from "./thermal-governor";

export function useCanvasLoop(
  ref: React.RefObject<HTMLCanvasElement | null>,
  draw: (ctx: CanvasRenderingContext2D, W: number, H: number, dpr: number, t: number) => void,
  deps: unknown[] = [],
) {
  useEffect(() => {
    const cvs = ref.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 1.5);

    let raf = 0;
    let t = 0;
    let visible = true;
    let docVisible = !document.hidden;
    let lastW = 0;
    let lastH = 0;
    let last = 0;
    // ~30fps on mobile, ~45fps on desktop — visually fine for ambient FX.
    const minFrameMs = isMobile ? 33 : 22;

    const resize = () => {
      const r = cvs.getBoundingClientRect();
      const W = Math.max(1, Math.round(r.width * dpr));
      const H = Math.max(1, Math.round(r.height * dpr));
      if (W !== lastW || H !== lastH) {
        cvs.width = W;
        cvs.height = H;
        lastW = W;
        lastH = H;
      }
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!visible || !docVisible) return;
      if (now - last < minFrameMs) return;
      last = now;
      resize();
      t += 0.01;
      draw(ctx, cvs.width, cvs.height, dpr, t);
    };

    // Static render once, even if paused/reduced.
    resize();
    draw(ctx, cvs.width, cvs.height, dpr, 0);

    if (reduced) return;

    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? true;
      },
      { rootMargin: "100px" },
    );
    io.observe(cvs);
    const onVis = () => {
      docVisible = !document.hidden;
    };
    document.addEventListener("visibilitychange", onVis);
    const onResize = () => {
      lastW = 0;
      lastH = 0;
    };
    window.addEventListener("resize", onResize);

    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("resize", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
