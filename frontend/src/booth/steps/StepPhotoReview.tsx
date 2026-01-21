import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import KioskChrome from "@/booth/components/KioskChrome";
import { useBoothFlow } from "@/booth/flow/BoothFlowProvider";

export default function StepPhotoReview() {
  const { order, go, back } = useBoothFlow();

  const total = order.requiredShots || 0;
  const filled = order.photos.filter(Boolean).length;
  const index = Math.max(0, Math.min(total - 1, filled - 1));

  const photo = order.photos[index];
  const retakeUsed = !!order.retakesUsedByIndex[index];

  useEffect(() => {
    const id = window.setTimeout(() => {
      if (filled >= total) go("final_review");
      else go("capture");
    }, 6000);
    return () => window.clearTimeout(id);
  }, [filled, total, go]);

  return (
    <KioskChrome title="Review" subtitle="Each photo can be retaken only once. Auto-advances shortly." showBack onBack={back}>
      <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
        <div className="overflow-hidden rounded-2xl border bg-card/30">
          <div className="aspect-video w-full bg-secondary/20">
            {photo?.url ? (
              <img src={photo.url} alt={`Captured photo ${index + 1}`} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No photo yet</div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border bg-secondary/25 p-5">
            <div className="text-xl font-semibold">Photo {index + 1} of {total}</div>
            <p className="mt-2 text-sm text-muted-foreground">Each photo can be retaken only once.</p>
          </div>

          <Button
            variant={retakeUsed ? "outline" : "kiosk"}
            size="kiosk"
            disabled={retakeUsed}
            onClick={() => {
              // The capture step will mark retake used after capture
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (order as any).activeReviewIndex = index;
              go("capture");
            }}
          >
            {retakeUsed ? "Retake used" : "Retake (once)"}
          </Button>

          <div className="text-xs text-muted-foreground">Auto-advancing in ~6s…</div>
        </div>
      </div>
    </KioskChrome>
  );
}
