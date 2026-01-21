import { Button } from "@/components/ui/button";
import KioskChrome from "@/booth/components/KioskChrome";
import { useBoothFlow } from "@/booth/flow/BoothFlowProvider";

export default function StepFinalReview() {
  const { order, requestRetake, next, lockPhotos, back } = useBoothFlow();
  const total = order.requiredShots || 0;

  return (
    <KioskChrome title="Final photo review" subtitle="Review all shots. Retake buttons disable after use. Proceed locks permanently." showBack onBack={back}>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {Array.from({ length: total }).map((_, i) => {
          const photo = order.photos[i];
          const used = !!order.retakesUsedByIndex[i];

          return (
            <div key={i} className="overflow-hidden rounded-2xl border bg-card/30">
              <div className="aspect-[4/3] bg-secondary/20">
                {photo?.url ? (
                  <img src={photo.url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Missing</div>
                )}
              </div>
              <div className="flex items-center justify-between gap-3 p-3">
                <div className="text-sm font-medium">Photo {i + 1}</div>
                <Button
                  variant={used || order.locked.photos ? "outline" : "soft"}
                  className="h-9 rounded-xl px-3"
                  disabled={used || order.locked.photos}
                  onClick={() => requestRetake(i)}
                >
                  {used ? "Retake used" : "Retake"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex items-center justify-end">
        <Button
          variant="kiosk"
          size="kiosk"
          onClick={() => {
            lockPhotos();
            next();
          }}
          disabled={order.photos.filter(Boolean).length !== total}
        >
          Proceed
        </Button>
      </div>
    </KioskChrome>
  );
}
