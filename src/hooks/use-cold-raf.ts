// Cold-compute animation hook.
// Runs the RAF callback only when:
//   1. the element is intersecting the viewport, AND
//   2. the document is visible, AND
//   3. the user has NOT requested reduced motion.
// Caps to ~targetFps (default 24) so canvases don't melt phone batteries.
//
// `cb(dt)` receives delta seconds since the previous tick.
import { useEffect, useRef } from "react";

export function useColdRaf(
  ref: React.RefObject<HTMLElement | null>,
  cb: (dt: number) => void,
  opts: { fps?: number; deps?: unknown[] } = {},
) {
  const { fps = 24 } = opts;
  const cbRef = useRef(cb);
  cbRef.current = cb;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    // Draw a single frame so the canvas isn't blank, then bail.
    if (reduced) {
      cbRef.current(0);
      return;
    }

    let raf = 0;
    let last = performance.now();
    let visible = false;
    let docVisible = !document.hidden;
    const minStep = 1000 / fps;

    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      const dt = t - last;
      if (dt < minStep) return;
      last = t;
      cbRef.current(dt / 1000);
    };

    const start = () => {
      if (raf || !visible || !docVisible) return;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? false;
        if (visible) start();
        else stop();
      },
      { rootMargin: "100px" },
    );
    io.observe(el);

    const onVis = () => {
      docVisible = !document.hidden;
      if (docVisible) start();
      else stop();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      stop();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, fps, ...(opts.deps ?? [])]);
}
