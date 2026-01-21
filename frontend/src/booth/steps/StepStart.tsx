import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import KioskChrome from "@/booth/components/KioskChrome";
import { useBoothFlow } from "@/booth/flow/BoothFlowProvider";
import { getAdminPin, setAdminAuthed } from "@/booth/admin/adminAuth";
import { loadIdleCopyConfig } from "@/booth/idle/idleCopy";
import { useIdleCopyCarousel } from "@/booth/idle/useIdleCopyCarousel";

export default function StepStart() {
  const { startNewOrder } = useBoothFlow();
  const navigate = useNavigate();

  const prefersReduced = useMemo(
    () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  const [idleCopy, setIdleCopy] = useState(() => loadIdleCopyConfig());
  useEffect(() => {
    const reload = () => setIdleCopy(loadIdleCopyConfig());
    const onStorage = (e: StorageEvent) => {
      if (e.key === "nexora.booth.idle_copy.v1" || e.key === "nexora.booth.idle_copy.bump.v1") reload();
    };
    window.addEventListener("nexora.idle_copy.updated", reload);
    // Also respond to cross-tab/localStorage updates.
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("nexora.idle_copy.updated", reload);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  const { variant: active, phase } = useIdleCopyCarousel({
    config: idleCopy,
    enabled: !prefersReduced,
    // Keep total transition comfortably below intervalMs.
    fadeOutMs: 750,
    fadeInMs: 750,
  });

  const [adminOpen, setAdminOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  const hint = useMemo(() => {
    const p = getAdminPin();
    return p ? `PIN: ${"•".repeat(Math.min(6, p.length))}` : "PIN required";
  }, []);

  const submit = () => {
    const expected = getAdminPin();
    if (!pin.trim()) {
      setError("Enter PIN");
      return;
    }
    if (pin.trim() !== expected) {
      setError("Incorrect PIN");
      return;
    }

    setAdminAuthed();
    setAdminOpen(false);
    setPin("");
    setError(null);
    navigate("/admin");
  };

  const textVisibilityClass =
    phase === "out"
      ? "opacity-0 translate-y-1"
      : phase === "in"
        ? "opacity-100 translate-y-0"
        : "opacity-100 translate-y-0";

  return (
    <KioskChrome
      title=""
      subtitle=""
      right={
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-secondary/60 px-4 py-2 text-xs text-muted-foreground">Offline-first</div>
          <button
            type="button"
            onClick={() => {
              setAdminOpen(true);
              setError(null);
              setPin("");
            }}
            data-no-start
            className="inline-flex h-10 items-center gap-2 rounded-full border bg-card/30 px-4 text-xs text-muted-foreground transition hover:bg-card/40 focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Admin"
          >
            <Settings className="h-4 w-4" aria-hidden="true" />
            <span className="tracking-[0.18em] uppercase">Admin</span>
          </button>
        </div>
      }
    >
      <div
        className="min-h-[68vh]"
        onPointerDown={(e) => {
          const el = e.target as HTMLElement | null;
          if (el?.closest?.("[data-no-start]")) return;
          startNewOrder();
        }}
      >
        <section className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center px-2 py-14 text-center">
          {/* Eyebrow */}
          <div className="animate-fade-up [animation-delay:60ms] [animation-fill-mode:both] text-xs font-light tracking-[0.45em] text-muted-foreground motion-safe:animate-attract-sub motion-reduce:animate-none">
            NEXORA
          </div>

          {/* Headline */}
          <div className="relative mt-7">
            <h2
              className={
                "whitespace-pre-line animate-fade-up [animation-delay:140ms] [animation-fill-mode:both] text-balance text-4xl font-medium leading-[0.98] tracking-[-0.04em] sm:text-6xl sm:leading-[0.92] md:text-7xl motion-safe:animate-attract-headline motion-reduce:animate-none transform-gpu transition-[opacity,transform] duration-[750ms] " +
                textVisibilityClass
              }
            >
              {active.headline}
            </h2>
          </div>

          {/* Subheading */}
          <div className="relative mt-6 max-w-2xl">
            <p
              className={
                "whitespace-pre-line animate-fade-up [animation-delay:220ms] [animation-fill-mode:both] text-pretty font-sans text-[15px] leading-[1.85] text-muted-foreground sm:text-base md:text-lg md:leading-[1.75] motion-safe:animate-attract-sub motion-reduce:animate-none transform-gpu transition-[opacity,transform] duration-[750ms] " +
                textVisibilityClass
              }
            >
              {active.subheading}
            </p>
          </div>

          {/* Divider */}
          <div className="mt-11 h-px w-24 animate-fade-up [animation-delay:260ms] [animation-fill-mode:both] bg-border" />

          {/* CTA */}
          <div className="mt-10 animate-fade-up [animation-delay:320ms] [animation-fill-mode:both]">
            <Button
              type="button"
              variant="ghost"
              onClick={startNewOrder}
              data-no-start
              className="group h-16 rounded-full px-10 text-base font-medium tracking-[0.08em] underline-offset-8 transition hover:underline focus-visible:underline motion-safe:animate-attract-cta motion-reduce:animate-none"
            >
              <span className="inline-flex items-center gap-2">
                Begin your story
                <span
                  aria-hidden="true"
                  className="transition-transform duration-300 group-hover:translate-x-0.5 group-focus-visible:translate-x-0.5"
                >
                  →
                </span>
              </span>
            </Button>
          </div>

          <div className="mt-10 animate-fade-up [animation-delay:380ms] [animation-fill-mode:both] text-xs text-muted-foreground">
            Operator tip: templates can be managed at <span className="font-medium">/admin/templates</span>.
          </div>
        </section>

        <Dialog open={adminOpen} onOpenChange={setAdminOpen}>
          <DialogContent data-no-start>
            <DialogHeader>
              <DialogTitle>Admin access</DialogTitle>
              <DialogDescription>Enter the operator PIN to open Admin.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-2">
              <Input
                type="password"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submit();
                }}
                placeholder={hint}
              />
              {error ? <div className="text-sm text-destructive">{error}</div> : null}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setAdminOpen(false)}>
                Cancel
              </Button>
              <Button variant="kiosk" onClick={submit}>
                Unlock
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </KioskChrome>
  );
}
