import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import KioskChrome from "@/booth/components/KioskChrome";
import { useBoothFlow } from "@/booth/flow/BoothFlowProvider";

export default function StepThankYou() {
  const { resetToStart } = useBoothFlow();

  useEffect(() => {
    const id = window.setTimeout(() => {
      void resetToStart();
    }, 9000);
    return () => window.clearTimeout(id);
  }, [resetToStart]);

  return (
    <KioskChrome title="Thank you" subtitle="Your prints are being prepared. QR delivery (optional) will appear here.">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border bg-card/40 p-6">
          <div className="text-3xl font-semibold">Session complete</div>
          <p className="mt-2 text-muted-foreground">
            We’ll return to the start screen automatically.
          </p>
          <div className="mt-6">
            <Button variant="kiosk" size="kiosk" onClick={() => void resetToStart()}>
              Reset now
            </Button>
          </div>
        </div>
        <div className="rounded-2xl border bg-secondary/25 p-6 text-sm text-muted-foreground">
          Placeholder for BTS processing, extra exports, or offline sync queue.
        </div>
      </div>
    </KioskChrome>
  );
}
