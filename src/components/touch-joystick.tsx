// On-screen virtual thumb joystick for the world walkthrough.
// Emits a normalized vector (-1..1, -1..1). Mounted only on touch devices.

import { useEffect, useRef, useState } from "react";

interface Vec2 { x: number; y: number }

interface JoystickProps {
  side: "left" | "right";
  size?: number;          // outer diameter px
  onChange: (v: Vec2) => void;
  label?: string;
}

export function TouchJoystick({ side, size = 130, onChange, label }: JoystickProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState<Vec2>({ x: 0, y: 0 });
  const [active, setActive] = useState(false);
  const pointerId = useRef<number | null>(null);
  const radius = size / 2;
  const knobMax = radius * 0.55;

  useEffect(() => {
    const el = ref.current; if (!el) return;
    const reset = () => {
      pointerId.current = null;
      setKnob({ x: 0, y: 0 });
      setActive(false);
      onChange({ x: 0, y: 0 });
    };
    const onDown = (e: PointerEvent) => {
      if (pointerId.current !== null) return;
      pointerId.current = e.pointerId;
      el.setPointerCapture(e.pointerId);
      setActive(true);
      handle(e);
    };
    const handle = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const d = Math.hypot(dx, dy) || 1;
      const clamped = Math.min(d, knobMax);
      const kx = (dx / d) * clamped;
      const ky = (dy / d) * clamped;
      setKnob({ x: kx, y: ky });
      onChange({ x: kx / knobMax, y: ky / knobMax });
    };
    const onMove = (e: PointerEvent) => {
      if (pointerId.current !== e.pointerId) return;
      handle(e);
    };
    const onUp = (e: PointerEvent) => {
      if (pointerId.current !== e.pointerId) return;
      try { el.releasePointerCapture(e.pointerId); } catch {}
      reset();
    };
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
    };
  }, [knobMax, onChange]);

  return (
    <div
      ref={ref}
      className={`pointer-events-auto absolute bottom-6 ${side === "left" ? "left-4" : "right-4"} touch-none select-none rounded-full border border-white/20 backdrop-blur-md`}
      style={{
        width: size, height: size,
        background: active
          ? "radial-gradient(circle at 50% 50%, rgba(34,211,238,0.18), rgba(0,0,0,0.6))"
          : "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.06), rgba(0,0,0,0.55))",
        boxShadow: active ? "0 0 24px -4px rgba(34,211,238,0.6)" : "inset 0 0 18px rgba(0,0,0,0.6)",
      }}
    >
      <div
        className="absolute left-1/2 top-1/2 rounded-full border border-cyan-300/70 bg-cyan-400/30"
        style={{
          width: size * 0.38, height: size * 0.38,
          transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))`,
          boxShadow: "0 0 18px rgba(34,211,238,0.55)",
          transition: active ? "none" : "transform 150ms ease-out",
        }}
      />
      {label && (
        <div className="pointer-events-none absolute inset-x-0 -top-5 text-center font-mono text-[9px] uppercase tracking-[0.25em] text-white/60">
          {label}
        </div>
      )}
    </div>
  );
}

// Round action button (fire / interact). Pointer-driven so it stacks with joysticks.
export function TouchButton({
  side, bottom, label, color, onPress, onRelease,
}: {
  side: "left" | "right";
  bottom: number;
  label: string;
  color: string;
  onPress: () => void;
  onRelease?: () => void;
}) {
  const [down, setDown] = useState(false);
  return (
    <button
      onPointerDown={(e) => { e.preventDefault(); setDown(true); onPress(); }}
      onPointerUp={() => { setDown(false); onRelease?.(); }}
      onPointerCancel={() => { setDown(false); onRelease?.(); }}
      onContextMenu={(e) => e.preventDefault()}
      className={`pointer-events-auto absolute touch-none select-none rounded-full border font-mono text-[10px] uppercase tracking-[0.2em] backdrop-blur-md transition-transform ${
        side === "left" ? "left-44" : "right-44"
      } ${down ? "scale-95" : ""}`}
      style={{
        bottom,
        width: 76, height: 76,
        borderColor: color,
        color,
        background: down ? `radial-gradient(circle, ${color}33, #00000099)` : "rgba(0,0,0,0.55)",
        boxShadow: down ? `0 0 28px -4px ${color}` : `inset 0 0 12px rgba(0,0,0,0.6)`,
      }}
    >
      {label}
    </button>
  );
}

// Detect touch-capable devices (we still allow on hybrid laptops).
export function useIsTouch(): boolean {
  const [touch, setTouch] = useState(false);
  useEffect(() => {
    const t = typeof window !== "undefined" &&
      ("ontouchstart" in window || navigator.maxTouchPoints > 0);
    setTouch(t);
  }, []);
  return touch;
}
