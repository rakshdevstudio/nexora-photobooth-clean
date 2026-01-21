import { useEffect, useMemo, useRef } from "react";
import BoothRouter from "@/booth/BoothRouter";

export default function BoothApp() {
  const rootRef = useRef<HTMLDivElement | null>(null);

  const prefersReduced = useMemo(
    () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  useEffect(() => {
    if (prefersReduced) return;
    const el = rootRef.current;
    if (!el) return;

    let lastPointerAt = Date.now();
    let raf = 0;

    const setSpotlight = (xPct: number, yPct: number) => {
      el.style.setProperty("--mx", `${xPct.toFixed(2)}%`);
      el.style.setProperty("--my", `${yPct.toFixed(2)}%`);
    };

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      lastPointerAt = Date.now();
      setSpotlight(x, y);
    };

    // Slow, cinematic drift when the user isn't interacting.
    // Prefers-reduced-motion safe (effect returns early above).
    const loop = () => {
      const idleMs = Date.now() - lastPointerAt;
      // Start drifting after a short idle period.
      if (idleMs > 1400) {
        const t = performance.now() / 1000;
        // Gentle Lissajous-ish motion around the center.
        const x = 50 + Math.sin(t * 0.12) * 10 + Math.sin(t * 0.035) * 6;
        const y = 22 + Math.cos(t * 0.10) * 7 + Math.sin(t * 0.03) * 4;
        setSpotlight(x, y);
      }
      raf = window.requestAnimationFrame(loop);
    };
    raf = window.requestAnimationFrame(loop);

    el.addEventListener("pointermove", onMove);
    return () => {
      el.removeEventListener("pointermove", onMove);
      window.cancelAnimationFrame(raf);
    };
  }, [prefersReduced]);

  return (
    <div ref={rootRef} className="nexora-spotlight">
      <BoothRouter />
    </div>
  );
}
