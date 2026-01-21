import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import KioskChrome from "@/booth/components/KioskChrome";
import { useBoothFlow } from "@/booth/flow/BoothFlowProvider";
import { WebCameraEngine } from "@/booth/engines/camera/webCameraEngine";

function useCountdown(seconds: number, running: boolean) {
  const [t, setT] = useState(seconds);
  useEffect(() => {
    if (!running) return;
    setT(seconds);
    const id = window.setInterval(() => setT((v) => Math.max(0, v - 1)), 1000);
    return () => window.clearInterval(id);
  }, [seconds, running]);
  return t;
}

export default function StepCapture() {
  const { order, attachPhotoAt, go, next, markRetakeUsed, back, captureCountdownSeconds } = useBoothFlow();
  const engine = useMemo(() => new WebCameraEngine(), []);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const orderRef = useRef(order);
  useEffect(() => {
    orderRef.current = order;
  }, [order]);

  const captureCtxRef = useRef<{
    targetIndex: number;
    isRetake: boolean;
    total: number;
  } | null>(null);

  const [streamReady, setStreamReady] = useState(false);
  const [capturing, setCapturing] = useState(false);

  const total = order.requiredShots || 0;
  const nextIndex = Math.max(0, order.photos.findIndex((p) => !p));
  const isRetake = order.activeReviewIndex !== undefined;
  const targetIndex = isRetake ? order.activeReviewIndex! : nextIndex;

  const countdown = useCountdown(captureCountdownSeconds, capturing);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const stream = await engine.start(order.cameraSource ?? "webcam");
        if (!mounted) return;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setStreamReady(true);
      } catch {
        setStreamReady(false);
      }
    })();

    return () => {
      mounted = false;
      void engine.stop();
    };
  }, [engine, order.cameraSource]);

  useEffect(() => {
    if (!capturing) return;
    if (countdown !== 0) return;

    const ctx = captureCtxRef.current;
    if (!ctx) return;

    (async () => {
      const video = videoRef.current;
      if (!video) return;

      const blob = await engine.captureFrame(video);
      attachPhotoAt(ctx.targetIndex, blob);

      if (ctx.isRetake) {
        markRetakeUsed(ctx.targetIndex);
        go("photo_review");
        return;
      }

      // Use a ref to avoid stale closures (prevents getting stuck / wrong step routing).
      const filledNow = orderRef.current.photos.filter(Boolean).length + 1;
      if (filledNow >= ctx.total) go("final_review");
      else go("photo_review");
    })().finally(() => {
      captureCtxRef.current = null;
      setCapturing(false);
    });
  }, [attachPhotoAt, capturing, countdown, engine, go, markRetakeUsed]);

  return (
    <KioskChrome title="Capture" subtitle="Live preview, countdown, and shot tracking." showBack onBack={back}>
      <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
        <div className="overflow-hidden rounded-2xl border bg-card/30">
          <div className="relative aspect-video w-full bg-secondary/20">
            <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />

            {/* On-screen "Get ready" overlay synced to the capture countdown */}
            {capturing ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  {countdown > 3 ? (
                    <div className="animate-fade-in rounded-2xl border bg-background/70 px-6 py-3 text-base font-semibold text-foreground shadow-elevated">
                      Get ready…
                    </div>
                  ) : (
                    <div className="animate-enter rounded-3xl border bg-background/70 px-10 py-6 text-7xl font-bold tabular-nums text-foreground shadow-elevated md:text-8xl">
                      {Math.max(1, countdown)}
                    </div>
                  )}
                  <div className="text-xs tracking-[0.22em] uppercase text-muted-foreground">
                    Look at the camera
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border bg-secondary/25 p-5">
            <div className="text-xs tracking-[0.22em] uppercase text-muted-foreground">Progress</div>
            <div className="mt-2 text-xl font-semibold">
              Photo {targetIndex + 1} of {total}
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              {isRetake ? "Retake in progress (one-time)." : "Standard capture."}
            </div>
          </div>

          <div className="rounded-2xl border bg-card/40 p-5">
            <div className="text-xs tracking-[0.22em] uppercase text-muted-foreground">Countdown</div>
            <div className="mt-2 text-5xl font-semibold tabular-nums">{capturing ? countdown : "—"}</div>
            <div className="mt-4 flex gap-3">
              <Button
                variant="kiosk"
                size="kiosk"
                onClick={() => {
                  captureCtxRef.current = { targetIndex, isRetake, total };
                  setCapturing(true);
                }}
                disabled={!streamReady || capturing || total === 0}
              >
                {capturing ? "Capturing…" : "Capture"}
              </Button>
              <Button variant="outline" className="h-16 rounded-2xl px-8" onClick={() => next()}>
                Skip
              </Button>
            </div>
            {!streamReady ? (
              <div className="mt-3 text-sm text-muted-foreground">
                Camera permission required. In kiosk EXE mode, permissions are controlled by the host runtime.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </KioskChrome>
  );
}
