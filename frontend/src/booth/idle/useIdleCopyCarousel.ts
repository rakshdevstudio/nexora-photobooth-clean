import { useEffect, useMemo, useRef, useState } from "react";
import type { IdleCopyConfig, IdleCopyVariant } from "@/booth/idle/idleCopy";

type Phase = "in" | "out" | "steady";

export type UseIdleCopyCarouselParams = {
  config: IdleCopyConfig;
  enabled: boolean;
  fadeOutMs?: number;
  fadeInMs?: number;
};

export function useIdleCopyCarousel({
  config,
  enabled,
  fadeOutMs = 650,
  fadeInMs = 650,
}: UseIdleCopyCarouselParams): {
  variant: IdleCopyVariant;
  phase: Phase;
  carouselEnabled: boolean;
} {
  const variants = config.variants;
  const intervalMs = config.intervalMs;

  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("steady");
  const timersRef = useRef<number[]>([]);

  const carouselEnabled = useMemo(() => {
    if (!enabled) return false;
    if (!variants || variants.length < 2) return false;
    // Strict timing safety: ensure we can complete OUT + IN before the next tick.
    // Keep a wide buffer to avoid race conditions on slow kiosks.
    const minInterval = fadeOutMs + fadeInMs + 800;
    return Number.isFinite(intervalMs) && intervalMs > minInterval;
  }, [enabled, fadeInMs, fadeOutMs, intervalMs, variants]);

  const variant = variants[Math.min(idx, Math.max(0, variants.length - 1))];

  useEffect(() => {
    // Always clear timers when conditions change to avoid races.
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];

    if (!carouselEnabled) {
      setIdx(0);
      setPhase("steady");
      return;
    }

    let cancelled = false;

    const scheduleNext = () => {
      // a) Fade OUT current
      setPhase("out");

      const t1 = window.setTimeout(() => {
        if (cancelled) return;

        // b) Remove/unmount previous (we swap content while fully hidden)
        setIdx((prev) => (prev + 1) % variants.length);

        // c) Insert next + d) Fade IN next
        setPhase("in");

        const t2 = window.setTimeout(() => {
          if (cancelled) return;
          setPhase("steady");
        }, fadeInMs);
        timersRef.current.push(t2);
      }, fadeOutMs);
      timersRef.current.push(t1);
    };

    const intervalId = window.setInterval(scheduleNext, intervalMs);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      timersRef.current.forEach((t) => window.clearTimeout(t));
      timersRef.current = [];
    };
  }, [carouselEnabled, fadeInMs, fadeOutMs, intervalMs, variants.length]);

  return { variant, phase, carouselEnabled };
}
